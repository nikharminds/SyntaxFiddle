import type { CronDialect } from "./dialects";
import type { CronFieldDetail } from "./engine";
import {
  awsEquivalentExpression,
  nodeCronEquivalentExpression,
  unixEquivalentExpression,
  type CronRecipe,
} from "./recipes";

export interface RecipeFaq {
  question: string;
  answer: string;
}

export interface CodeSnippet {
  id: string;
  label: string;
  language: "js" | "python" | "yaml" | "bash" | "ts";
  code: string;
  scheduleLiteral?: string;
  note?: string;
}

const DIALECT_LABELS: Record<CronDialect, string> = {
  unix: "Unix cron",
  aws: "AWS EventBridge",
  quartz: "Quartz",
  cloudflare: "Cloudflare Workers",
};

const UTC_BEHAVIOR: Record<CronDialect, string> = {
  unix:
    "The classic cron daemon interprets every field in the machine's local timezone (from /etc/timezone or the TZ environment variable). If the server runs in UTC the schedule fires in UTC; otherwise shift the hours accordingly. Modern cronie also supports CRON_TZ to pin a single job to UTC.",
  cloudflare:
    "Cloudflare Workers Cron Triggers always evaluate in UTC, no matter where your worker executes. Convert your desired local time to UTC before configuring the trigger, or compute the offset inside the worker itself.",
  aws:
    "AWS EventBridge evaluates cron expressions in UTC only — there is no per-rule timezone setting. Convert your target local time, including daylight saving adjustments, to UTC when authoring the expression.",
  quartz:
    "Quartz evaluates the trigger in the timezone configured on the scheduler or on the individual trigger's timeZone property, defaulting to the JVM's default timezone. Spring's @Scheduled uses the server default unless you set the zone attribute per task.",
};

export function buildRecipeFaqs(
  recipe: CronRecipe,
  humanReadable: string,
  fields: CronFieldDetail[]
): RecipeFaq[] {
  const fieldSummary = fields
    .map((field) => `${field.name} (${field.value})`)
    .join(", ");

  const meaningFaq: RecipeFaq = {
    question: `What does the cron expression "${recipe.expression}" mean?`,
    answer: `"${recipe.expression}" is ${recipe.dialect === "aws" ? "an" : "a"} ${DIALECT_LABELS[recipe.dialect]} expression that means: ${humanReadable}. It contains ${fields.length} fields — ${fieldSummary} — and works in any scheduler that accepts the ${DIALECT_LABELS[recipe.dialect]} format.`,
  };

  const timezoneFaq: RecipeFaq = {
    question: `How does "${recipe.expression}" behave in UTC versus local time?`,
    answer: UTC_BEHAVIOR[recipe.dialect],
  };

  let practicalFaq: RecipeFaq;
  if (recipe.category === "minutes" || recipe.category === "hourly") {
    practicalFaq = {
      question: `How do I test "${recipe.expression}" on a Linux server?`,
      answer: `Add it with crontab -e, save, and watch the log: /var/log/syslog on Debian/Ubuntu or /var/log/cron on RHEL-family systems shows every firing. For a dry run without touching your crontab, use the simulator at the top of this page — it computes the next runs locally in your browser.`,
    };
  } else if (recipe.category === "daily") {
    practicalFaq = {
      question: `What happens if the machine is offline when "${recipe.expression}" is due?`,
      answer: `Classic cron does not catch up missed runs: if the server is down at the fire time, that execution is skipped until the next match. Guard the command with an idempotency check, or use anacron or a scheduler with missed-run handling when catch-up behavior matters.`,
    };
  } else if (recipe.category === "platform-specific") {
    practicalFaq = {
      question: `Is "${recipe.expression}" valid outside ${DIALECT_LABELS[recipe.dialect]}?`,
      answer: `Not directly. Standard Unix cron expects 5 fields without '?', Quartz expects a leading seconds field, and AWS EventBridge appends a year and requires '?' in one of the two day fields. The conversion snippets below show the equivalent expression for each platform.`,
    };
  } else {
    practicalFaq = {
      question: `Can I combine "${recipe.expression}" with holidays or blackout dates?`,
      answer: `Standard cron has no holiday awareness. The common pattern is to keep the schedule as-is and guard the job: check a holiday calendar when the run starts and exit early on excluded days. That keeps the schedule declarative while your code owns the policy.`,
    };
  }

  return [meaningFaq, timezoneFaq, practicalFaq];
}

export function buildRecipeSnippets(recipe: CronRecipe): CodeSnippet[] {
  const nodeExpression = nodeCronEquivalentExpression(recipe);
  const unixConversion = unixEquivalentExpression(recipe);
  const awsConversion = awsEquivalentExpression(recipe);
  const isUnixNative = recipe.dialect === "unix" || recipe.dialect === "cloudflare";
  const convertedNote = isUnixNative
    ? undefined
    : "Converted to the standard 5-field crontab syntax that Linux, GitHub Actions, and APScheduler expect.";
  const unsupportedCode = `# The 5-field cron syntax cannot express "${recipe.expression}".\n# Use a scheduler with rich triggers (APScheduler CronTrigger(day='last'),\n# node-cron 'L' support, or the AWS/Quartz syntax shown in the AWS tab).`;

  const snippets: CodeSnippet[] = [
    {
      id: "node",
      label: "Node.js",
      language: "js",
      code: `import cron from 'node-cron';\n\ncron.schedule('${nodeExpression}', () => {\n  console.log('Running task...');\n});`,
      scheduleLiteral: nodeExpression,
    },
    {
      id: "python",
      label: "Python",
      language: "python",
      code: unixConversion
        ? `from apscheduler.schedulers.blocking import BlockingScheduler\nfrom apscheduler.triggers.cron import CronTrigger\n\nsched = BlockingScheduler()\nsched.add_job(task, CronTrigger.from_crontab('${unixConversion}'))`
        : `from apscheduler.schedulers.blocking import BlockingScheduler\n\nsched = BlockingScheduler()\n# Cron cannot express this cadence — use a rich trigger or interval instead.\nsched.add_job(task, "interval", seconds=1)`,
      scheduleLiteral: unixConversion ?? undefined,
      note: unixConversion
        ? convertedNote
        : "This cadence is not expressible in standard cron; APScheduler's interval trigger is the idiomatic equivalent.",
    },
    {
      id: "github-actions",
      label: "GitHub Actions",
      language: "yaml",
      code: unixConversion
        ? `name: Scheduled task\n\non:\n  schedule:\n    - cron: '${unixConversion}'\n\njobs:\n  run:\n    runs-on: ubuntu-latest\n    steps:\n      - run: echo "Running task..."`
        : `# GitHub Actions accepts 5-field UTC cron only and cannot express\n# "${recipe.expression}". Approximate with a daily guard job and\n# check the date condition inside the step:\non:\n  schedule:\n    - cron: '59 23 * * *'`,
      scheduleLiteral: unixConversion ?? undefined,
      note: unixConversion
        ? convertedNote ?? "GitHub Actions evaluates scheduled workflows in UTC."
        : "GitHub Actions cannot express this schedule; the shown nightly job is the standard guard-job starting point.",
    },
    {
      id: "crontab",
      label: "Crontab",
      language: "bash",
      code: unixConversion
        ? `${unixConversion} /usr/local/bin/backup.sh >> /var/log/cron.log 2>&1`
        : `# Unix crontab cannot express "${recipe.expression}".\n# Common approximation — run near the window and guard in code:\n59 23 28-31 * * /usr/local/bin/backup.sh >> /var/log/cron.log 2>&1`,
      scheduleLiteral: unixConversion ?? undefined,
      note: unixConversion
        ? convertedNote
        : "Standard crontab cannot express this schedule; the shown month-end guard is the conventional approximation.",
    },
    {
      id: "aws",
      label: "AWS CDK",
      language: "ts",
      code: `import { Schedule } from 'aws-cdk-lib/aws-events';\n\nnew Schedule(this, 'Task', {\n  schedule: Schedule.expression('cron(${awsConversion.expression})'),\n});`,
      scheduleLiteral: awsConversion.expression,
      note: awsConversion.note,
    },
  ];

  return snippets;
}

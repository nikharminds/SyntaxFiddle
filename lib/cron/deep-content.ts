import { getRecipe, type CronRecipe } from "./recipes";

/**
 * Deep-dive content for the highest-traffic cron recipes — the head-term
 * schedules people actually search for. Only recipes with something genuinely
 * cadence-specific to say get an entry; the long tail keeps the standard
 * recipe template, so the directory never degenerates into near-duplicate
 * programmatic pages.
 */

export interface RecipeDeepContent {
  sections: { heading: string; body: string[] }[];
  extraFaqs: { question: string; answer: string }[];
}

export const RECIPE_DEEP_CONTENT: Record<string, RecipeDeepContent> = {
  "every-5-minutes": {
    sections: [
      {
        heading: "What actually runs every 5 minutes in production",
        body: [
          "Five minutes is the classic polling interval — short enough that users never notice staleness, long enough that you are not hammering anything. The usual residents: HTTP health checks and synthetic probes that page someone within minutes of an outage; Prometheus-style metric exporters that scrape targets between evaluation passes; queue drainers that move work off slow database-backed tables; and cache warmers that pre-compute an expensive homepage or dashboard so the first request after a deploy is already fast. The */5 step form means the job fires at :00, :05, :10 — aligned to the wall clock, which also means every server running it fires at the same moment.",
          "That alignment is worth engineering around. Twelve fires per hour, all on the clock, produce a visible load sawtooth — the thundering-herd effect you can see in any metrics dashboard with 5-minute-period spikes. The standard mitigations: stagger the minute (7-59/5 fires at :07, :12, :17 — see the offset recipe), jitter the start inside the job, or accept the spikes when the work is trivial. If you are polling an external API, 12 calls an hour times your server count is also a rate-limit line worth counting before it counts against you.",
        ],
      },
      {
        heading: "Beyond crontab: systemd, Kubernetes, and Celery equivalents",
        body: [
          "On modern Linux, systemd timers are the crontab successor: a .timer unit with OnCalendar=*:0/5 fires every fifth minute with logging to journald, Persistent=false semantics, and the ability to survive reboots without a crontab install step. Kubernetes CronJobs take the same expression — schedule: \"*/5 * * * *\" in a batch/v1 CronJob — but add the operational knobs cron never had: concurrencyPolicy: Forbid stops a slow run from overlapping itself, backoffLimit bounds retries, and startingDeadlineSeconds decides whether a missed fire (during a controller outage) still counts. Since Kubernetes 1.27 you can set timeZone: directly; before that, the controller evaluated schedules in UTC and there was no per-job override.",
          "Python services usually skip OS cron for Celery beat: crontab(minute='*/5') in CELERY_BEAT_SCHEDULE delivers the same cadence inside your worker fleet, with the schedule shipped in code review instead of a server's crontab. Django's native answer for lightweight work is a management command invoked by any of the above. On Windows, Task Scheduler's schtasks /sc minute /mo 5 covers the same ground. The simulator above stays the same debugging tool for all of them — the expression is the contract; only the wrapper changes.",
        ],
      },
    ],
    extraFaqs: [
      {
        question: "How do I run a cron job every 5 minutes but avoid the thundering herd?",
        answer:
          "Offset the minute field. */5 * * * * fires exactly on :00/:05/:10 alongside every other server in the world; 4-59/5 * * * * fires at :04/:09/:14 and spreads your load. Add jitter inside the job (a short random sleep before the real work) when the target is a shared external API, and use a distributed lock (Redis, a database lease) when multiple workers run the same schedule so only one actually executes.",
      },
      {
        question: "Does Kubernetes CronJob support \"*/5 * * * *\" directly?",
        answer:
          "Yes — the schedule field takes standard 5-field cron, so \"*/5 * * * *\" works verbatim in a batch/v1 CronJob. Two platform notes: the controller evaluates schedules in UTC unless you set timeZone (available since Kubernetes 1.27), and you want concurrencyPolicy: Forbid or Replace if a single run can exceed five minutes, otherwise overlapping jobs pile up silently. missed deadline behavior is governed by startingDeadlineSeconds.",
      },
    ],
  },
  "every-15-minutes": {
    sections: [
      {
        heading: "The 15-minute cadence: what belongs on it",
        body: [
          "Fifteen minutes is the sweet spot between responsiveness and politeness. Typical work: log and metric batch-pushes that aggregate and flush to S3 or an observability backend; SSL/TLS certificate and endpoint monitors that alert fast without paging on a single blip; session and token sweepers that expire stale rows; webhook retry queues; and git mirror or config pull jobs that keep read-only replicas warm. At 96 runs a day, a job that takes 30 seconds costs 48 minutes of daily CPU — cheap — but a job that silently fails sends 96 alert-noise opportunities, which is why the retry and deadline knobs below matter more at this cadence than people expect.",
          "The quarter-hour alignment also plays well with monitoring systems natively: most dashboards graph at 15-minute granularity, so a job firing on the quarter-hour makes its own success trail directly overlayable on business metrics. When you deliberately want to dodge that alignment — spreading load away from everyone else's :00/:15/:30/:45 — shift the minute to 9-59/15 and the whole schedule moves to :09/:24/:39/:54 without changing the interval.",
        ],
      },
      {
        heading: "The same schedule as a systemd timer or Celery beat entry",
        body: [
          "systemd expresses quarter-hour cadence as OnCalendar=*:0/15 (or *:15/30 style offsets), with the pairing .service unit holding the actual command — and systemctl list-timers showing the next fire time, which is the observability crontab never gave you. Celery beat writes it as crontab(minute='*/15') in the beat schedule, shipping the cadence in version control next to the task it triggers. Both inherit the same UTC-versus-local question as cron: systemd timers default to the machine's local timezone and accept OnCalendar=*:0/15 UTC to pin explicitly; Celery beat evaluates crontab in the worker's timezone unless timezone is configured in the app.",
          "On the managed-platform side, GitHub Actions runs \"*/15 * * * *\" schedules natively — with the documented caveat that scheduled workflows can be delayed or skipped entirely at busy times and during repo inactivity, so anything load-bearing needs a watchdog. Cloudflare Workers Cron Triggers take the same expression for edge jobs. The field-by-field breakdown and next-run table above validate the expression itself; the platform differences are purely in the wrapper.",
        ],
      },
    ],
    extraFaqs: [
      {
        question: "Why did my every-15-minutes job fire at :09 instead of :00?",
        answer:
          "Because the minute field says so: */15 means start-of-range stepping — :00, :15, :30, :45 — while 9-59/15 starts at minute 9 and steps by 15: :09, :24, :39, :54. Same interval, different phase. Offset forms are a deliberate anti-thundering-herd technique; if you did not intend the offset, write */15. The next-run table above always shows the exact fire times your expression produces.",
      },
      {
        question: "Is every 15 minutes too frequent for a database cleanup job?",
        answer:
          "It depends entirely on what one run costs and locks. At 96 executions a day, a cleanup that scans with an index and deletes in bounded batches is negligible; one that locks a hot table for seconds per run is not — you will see it in p99 latency as periodic spikes. Make the job idempotent, batch its deletes (LIMIT clauses or batched DML), and prefer low-traffic windows for heavy compaction. The cadence itself is cheap; the job's footprint is what you are budgeting.",
      },
    ],
  },
  "every-hour": {
    sections: [
      {
        heading: "Hourly jobs: the workhorse cadence",
        body: [
          "0 * * * * — top of every hour — is the default cadence for an enormous slice of production work: hourly digest and rollup jobs that aggregate events into summary tables; ACME-style certificate renewal checks; feed fetchers and scrapers that respect polite rate limits; backup verification and checksum passes; and the hourly log-rotation window many distributions still ship. The top-of-hour alignment means hourly jobs collide with each other and with everyone else's analytics batch — which is why 15 * * * * (quarter past) and 30 * * * * (half past) exist as first-class recipes in this directory rather than exotic variations.",
          "An hourly job runs 8,766 times a year (8,784 in leap years), so the economics differ from daily jobs in kind, not just degree. One wasted second per run is 2.4 hours of CPU a year; one wasted database round-trip is invisible, but a table scan is not. The reliable pattern is a job that checks whether work is due (a watermark row, a flag) and exits in milliseconds when it is not — letting you keep the simple hourly schedule while doing expensive work only when something changed.",
        ],
      },
      {
        heading: "Hourly across platforms: timers, CronJobs, and managed schedulers",
        body: [
          "systemd ships a dedicated alias for this one: OnCalendar=hourly is exactly the top-of-hour cadence, with journald logging and RandomizedDelaySec available for spreading load. Kubernetes takes \"0 * * * *\" verbatim in a CronJob — add concurrencyPolicy: Forbid when a run might exceed an hour, or you get a slow leak of overlapping pods. AWS EventBridge expresses it as cron(0 * * * ?) in its 6-field, UTC-only dialect (there is a dedicated EventBridge hourly recipe in this directory with the exact syntax). Celery beat writes crontab() with no arguments — hour='*', minute=0 is the default.",
          "The timezone question earns special attention on the hour boundary: an hourly job is usually meant to be timezone-neutral (every hour is every hour everywhere), but the DST transitions still bite once a year when a 1 AM or 2 AM fire happens twice or never on machines keeping local time. Servers pinned to UTC — the overwhelming default — never see this; a cron line inherited from a local-time-era server can. The timezone switcher in the simulator above shows exactly what your machine's TZ setting does to the schedule.",
        ],
      },
    ],
    extraFaqs: [
      {
        question: "What is the difference between 0 * * * * and * * * * *?",
        answer:
          "The minute field. 0 * * * * fires once per hour, at minute 0 — the top of the hour, 24 times a day. * * * * * fires every single minute, 1,440 times a day. The difference is a 60x change in execution count, which is the most common copy-paste cron accident in existence: one stray asterisk turns an hourly rollup into a minute-level hammer. If a job suddenly seems to run constantly, check the minute field first.",
      },
      {
        question: "How do I run a job every hour but not at the top of the hour?",
        answer:
          "Move the minute field off zero: 17 * * * * fires at :17 every hour. This is the standard defense against the top-of-hour pile-up, where every cron on every server fires simultaneously at :00 — batch systems, databases, and APIs all see the same synchronized spike. The hourly-at-quarter-past, hourly-at-half-past, and hourly-at-quarter-to recipes in this directory exist precisely for this pattern.",
      },
    ],
  },
  "daily-at-midnight": {
    sections: [
      {
        heading: "Midnight jobs: the classic nightly batch",
        body: [
          "0 0 * * * is the most-written cron line in history, and its residents are the batch workload: full database backups and mysqldump/pg_dump runs; log rotation and archival (logrotate's own default); nightly ETL that folds the day's events into warehouse tables; retention sweeps that delete rows past their window; search-index rebuilds; and end-of-day financial or usage snapshots. Midnight is chosen because it is the lowest-traffic hour for most products — but it is also when every other nightly job runs, so databases see a synchronized backup-and-vacuum storm that operations teams know by heart.",
          "Two failure modes dominate midnight jobs. First, duration creep: a backup that took 20 minutes in year one takes three hours in year four, and now overlaps morning traffic — alert on runtime, not just exit code. Second, DST: on machines keeping local time, the 2 AM transition means one 23-hour day and one 25-hour day per year; a midnight job still fires daily, but anything scheduled between 1 and 3 AM can fire twice or not at all. UTC servers (the modern default) are immune; the timezone switcher above shows the difference for any zone you pick.",
        ],
      },
      {
        heading: "Nightly schedules on modern platforms",
        body: [
          "Kubernetes takes \"0 0 * * *\" directly, but the mature pattern for nightly batch is concurrencyPolicy: Forbid plus a generous activeDeadlineSeconds, because a nightly job that wedges should not still be running when the next one fires. systemd's OnCalendar=midnight (or the explicit *-*-* 00:00:00) pairs with Persistent=true — the setting that catches up a missed fire after downtime, which plain cron never does. Vercel Cron's canonical example is a daily schedule in vercel.json — crons run in UTC, and Hobby plans are limited to once-per-day precision, which is exactly this recipe's cadence.",
          "The managed-cloud version is usually better than cron for nightly work not because of the schedule but because of the surrounding contract: AWS EventBridge cron(0 0 * * ? *) into a Lambda or Step Functions state machine gives retries, DLQs, and observability that a bare crontab line does not. The expression is the same five fields you validate above; what changes is who guarantees the run. For anything that must not silently skip — billing, backups — that guarantee is the actual product feature.",
        ],
      },
    ],
    extraFaqs: [
      {
        question: "Does 0 0 * * * mean midnight at night or noon?",
        answer:
          "Midnight at the start of the day: hour 0, minute 0 — 00:00, the boundary between one day and the next. Noon is 0 12 * * * (hour 12). The 24-hour clock maps directly onto cron's hour field, so 3 AM is 3, 3 PM is 15, and there is no AM/PM ambiguity — which is exactly why getting 11:30 PM wrong as 0 11 * * * (11 AM) is such a classic incident-report paragraph.",
      },
      {
        question: "What happens if the server is down at midnight when a daily cron job should run?",
        answer:
          "Nothing — the run is simply skipped forever. Classic cron has no catch-up: if the machine is off, suspended, or the cron daemon is dead at 00:00, that execution never happens and the next chance is the following midnight. That is why production nightly jobs use anacron or systemd timers with Persistent=true (both replay missed runs after boot), or managed schedulers with retry policies — and why idempotent job design matters whenever catch-up is possible.",
      },
    ],
  },
  "daily-at-9am": {
    sections: [
      {
        heading: "The 9 AM job: business-hours scheduling and its timezone trap",
        body: [
          "0 9 * * * is the schedule for everything aimed at the start of the business day: morning digest emails (yesterday's metrics, new signups, failed payments), daily standup-bot posts, report generation and delivery, and cache pre-warms timed so the first human traffic arrives at a warm system. Nine in the morning is a business-time concept — and that is the entire problem with the schedule: cron has no idea what a business hour is. The cron daemon evaluates 9 against the machine's clock, so 0 9 * * * means 9 AM wherever the server lives, and in 2026 that is usually UTC.",
          "The arithmetic is worth doing once and writing down: 9 AM in India is 3:30 AM UTC; 9 AM US Eastern is 13:00 or 14:00 UTC depending on daylight saving; 9 AM Central Europe is 7:00 or 8:00 UTC. Teams get this wrong in both directions — the schedule written as local time on a UTC server fires at the wrong hour, and a schedule corrected once drifts twice a year when DST flips. The simulator above computes the actual fire times for any timezone you select, which settles the argument in one click.",
        ],
      },
      {
        heading: "Scheduling 9 AM reliably across platforms",
        body: [
          "On a UTC server, 9 AM local must be expressed in UTC — 0 4 * * 1-5 for 9 AM in +05:30, or 0 13 * * 1-5 for US Eastern during standard time — and the DST drift is handled either by a CRON_TZ line (cronie), by scheduling in UTC and computing 'is it 9 AM somewhere relevant' inside the job, or by pinning the schedule to the recipient's zone in a proper scheduler. Kubernetes 1.27+ solves it directly with the timeZone: field on the CronJob; AWS EventBridge cannot — it is UTC-only by design, so the conversion is yours to do and test.",
          "For delivery-shaped work (emails, digests, alerts), the robust architecture separates schedule from send: one job (or a scheduler-native trigger) computes who should receive what now, and the send layer handles per-recipient timezones. That keeps the cron line boring — one fire, one decision — while the timezone logic lives where it is testable. The recipe's field breakdown above is the contract; everything downstream of it is your code's job.",
        ],
      },
    ],
    extraFaqs: [
      {
        question: "How do I schedule a cron job for 9 AM in a specific timezone on a UTC server?",
        answer:
          "Convert once, encode the result: 9 AM IST is 0 3 * * * UTC (9 minus 5:30); 9 AM US Eastern is 0 13 * * * UTC in winter and 0 14 * * * in summer — a single static cron line cannot follow DST. Your options: cronie's CRON_TZ=Asia/Kolkata header before the job line, a scheduler with native timezone support (Kubernetes 1.27+ timeZone field, Quartz timeZone property, Celery CELERY_TIMEZONE), or schedule hourly and let the job check whether it is 9 AM in the target zone.",
      },
      {
        question: "Why did my 9 AM job start firing at 8 AM after a clock change?",
        answer:
          "Daylight saving moved the wall clock under a fixed cron expression. If the server keeps local time and the zone fell back, the hour field that meant 9 AM now means 8 AM local (or the reverse in spring) — the expression is unchanged, the wall clock moved. Servers running UTC never see this. The fix is structural: run the server in UTC and express business times in UTC explicitly, or use a scheduler with per-job timezone support instead of raw cron.",
      },
    ],
  },
  "weekdays-at-9am": {
    sections: [
      {
        heading: "Weekday-only 9 AM: the business-day trigger",
        body: [
          "0 9 * * 1-5 fires Monday through Friday at 9 AM — the schedule for standup and digest bots, daily report delivery, workday-morning cache pre-warms, and every internal tool that should stay quiet on weekends. The day-of-week field is where this one earns its FAQ entries: cron counts Sunday as 0 (or 7) through Saturday as 6, so 1-5 is Monday–Friday, and mixing 0-based and 1-based thinking is how a 'weekday' job ends up firing Sunday. The simulator above shows a full week of fire times, which settles the off-by-one instantly.",
          "The subtlety that bites weekday jobs is holidays: cron has no calendar awareness, so the standup bot posts through every public holiday and the report lands in empty inboxes on December 26. The standard design keeps the schedule dumb and gives the job the policy — check a holiday calendar (a table, a library, an API) on wake and exit early on excluded days. That keeps the cron line declarative and the exception logic versioned in code where it belongs, instead of editing crontabs every quarter.",
        ],
      },
      {
        heading: "Weekday schedules beyond the crontab",
        body: [
          "The platforms that wrap cron tend to inherit both its power and its day-numbering. Kubernetes takes \"0 9 * * 1-5\" verbatim — with timeZone available since 1.27 to pin the 9 AM to a real zone rather than the controller's clock. AWS EventBridge spells weekdays as cron(0 9 ? * MON-FRI *) in its 6-field dialect (there is a dedicated EventBridge weekdays recipe in this directory). Celery beat writes crontab(hour=9, minute=0, day_of_week='1-5') — accepting either numbers or names, where 'mon-fri' is the self-documenting form.",
          "Windows Task Scheduler, the platform that runs much of the corporate world, expresses this as a weekly trigger with Monday–Friday checkboxes rather than an expression — the same schedule in a different grammar. And for teams whose real requirement is 'every workday at 9 in each office's timezone,' the scalable answer is one schedule per zone or an hourly job with zone logic inside; a single cron line cannot mean nine different nines. The expression here is the starting point; the architecture decides how far it scales.",
        ],
      },
    ],
    extraFaqs: [
      {
        question: "Is Monday–Friday 1-5 or 0-4 in cron?",
        answer:
          "1-5. Cron's day-of-week field runs 0 (or 7) = Sunday, 1 = Monday, through 6 = Saturday, so 1-5 is Monday through Friday and 0,6 (or just 6, plus 0) covers the weekend. 0-4 would include Sunday. Names work too: MON-FRI is accepted by most modern cron implementations (cronie, Vixie derivatives, Quartz, EventBridge) and is immune to the off-by-one. The week-view in the simulator above shows exactly which days fire.",
      },
      {
        question: "How do I stop a weekday cron job from running on public holidays?",
        answer:
          "Cron cannot — it has no calendar concept, only fields. The accepted pattern is a guard inside the job: on wake, check a holiday table (a config file, a library like the Python holidays package, or an internal API) and exit early on excluded dates. Keep the cron line honest (weekdays) and the policy in code, so holiday rules are reviewed and versioned like everything else. Some schedulers offer calendar-aware schedules (Quartz calendars, ECS... none natively) — but a job-side guard is portable everywhere.",
      },
    ],
  },
  "every-minute": {
    sections: [
      {
        heading: "Every minute: the maximum cron frequency and its costs",
        body: [
          "* * * * * is cron's floor — 1,440 executions a day, one per minute. Legitimate residents are rare and small: liveness heartbeats that update a timestamp row another system watches, single-instance pollers pulling from a queue or mailbox, file watchers that would otherwise need inotify, and monitoring agents that need per-minute granularity. At this frequency the job's own weight dominates: 500 ms of runtime means the system spends 12 hours a day inside your job's process, and any lock the job takes is contended essentially always.",
          "The operational reality is that every-minute is usually the wrong tool worn smooth by habit. Polling a queue every minute when a message broker could push instantly; checking a file when inotify or fs.watch exists; recomputing state that could be event-driven — these are the refactors that delete the cron line entirely. When the cadence is genuinely needed, guard it: a distributed lock so only one node in a fleet actually runs, a runtime cap so a wedged job cannot stack 60 deep, and alerting on duration because at one-minute cadence a slow job is an outage wearing a schedule.",
        ],
      },
      {
        heading: "Per-minute scheduling on modern platforms",
        body: [
          "systemd timers go below the minute with OnUnitActiveSec=30s or OnCalendar=*:*:* for true per-minute fires, plus AccuracySec to trade precision for batching — by default systemd coalesces timers within a minute window, which is usually what you want and occasionally surprises people. Kubernetes CronJob documentation itself recommends against schedule: \"* * * * *\" for anything but trivial jobs (missed-fire accounting under load is explicitly called out); the platform-preferred shape is a Deployment with a sleep loop or a queue consumer instead.",
          "AWS EventBridge cannot schedule finer than one minute — cron(* * * * ? *) is its maximum rate, matching classic cron. Cloudflare Workers cron triggers do exactly per-minute. GitHub Actions runs \"* * * * *\" scheduled workflows but will disable them on repo inactivity, and its runners add minutes of startup latency — a per-minute Action is almost always a design smell. The field table above confirms the expression; whether the expression deserves to exist is the bigger question at this cadence.",
        ],
      },
    ],
    extraFaqs: [
      {
        question: "Is there anything faster than * * * * * in standard cron?",
        answer:
          "No — one minute is the resolution of the five-field format; there is no seconds field. Sub-minute scheduling requires a different mechanism: systemd timers (OnUnitActiveSec=15s), Quartz (six-field expressions with a leading seconds field — see the every-30-seconds Quartz recipe), a sleep-loop process, or an event-driven design that removes the timer entirely. The Quartz dialect exists precisely because classic cron cannot express seconds.",
      },
      {
        question: "Why is my every-minute cron job skipping runs?",
        answer:
          "Because a run overran. Cron does not run overlapping copies by default — while one instance is executing, the next minute's fire is skipped, silently. A job that takes 90 seconds executes roughly 24 times per hour, not 60. The fixes: make the job faster, make it async (enqueue and exit), or use flock-style locking with an explicit policy. On systems where a stuck job blocks the line, cron can also delay every job behind it — a 10-minute hang starves everything scheduled in that window.",
      },
    ],
  },
  "every-10-minutes": {
    sections: [
      {
        heading: "Ten-minute cadence: polling that respects limits",
        body: [
          "*/10 * * * * fires six times an hour — 144 runs a day — and it is the default interval for externally-facing polling precisely because it fits inside most API rate limits with room to spare. Common tenants: third-party API syncs (CRM to warehouse, payment status checks), email and webhook processors that batch for digestibility, DNS or certificate propagation checks, and status-page probes that need to be fresher than 15 minutes without being noisy. Six checks an hour is also the alerting sweet spot: an outage is detected within 10 minutes while a single failed check (one flaky network hop) does not page anyone.",
          "The offset variants matter more at ten minutes than anywhere else in the directory because */10's clock alignment (:00, :10, :20...) collides with a remarkable amount of infrastructure that batches on the ten-minute boundary. Shifting to 3-59/10 (:03, :13, :23...) costs nothing and removes the collision; the offset recipe in this directory exists for exactly this. And when the workload grows, ten-minute polling is the natural candidate for conversion to event-driven — a webhook plus reconciliation job on a slower schedule beats 144 daily polls that mostly discover nothing changed.",
        ],
      },
      {
        heading: "Ten-minute schedules in systemd, Kubernetes, and Django",
        body: [
          "systemd: OnCalendar=*:0/10 on a .timer unit, with the service unit holding the command — journald gives you per-fire logs, and systemctl list-timers shows the next three fire times, which is the debugging affordance crontab never had. Kubernetes: schedule: \"*/10 * * * *\" in a batch/v1 CronJob; the two settings that earn their keep at this cadence are concurrencyPolicy: Forbid (a ten-minute job that occasionally runs twelve minutes should never overlap itself) and a jobsHistoryLimit small enough to keep the API tidy.",
          "Django and Celery ship this as crontab(minute='*/10') in the beat schedule — note that Celery's crontab defaults to the app's timezone, which is the setting to verify before assuming UTC. GitHub Actions accepts \"*/10 * * * *\" with its usual caveat that scheduled workflows may be delayed several minutes under load — fine for reconciliation, wrong for anything latency-sensitive. Every platform here takes the identical five fields validated in the breakdown above; the wrapper changes, the expression does not.",
        ],
      },
    ],
    extraFaqs: [
      {
        question: "What is the difference between */10 and 0,10,20,30,40,50 in the minute field?",
        answer:
          "Nothing functionally — both fire at :00, :10, :20, :30, :40, :50. */10 means 'starting at the field minimum, every 10th value'; the explicit list names each one. The step form is easier to read and modify; the list form lets you break alignment (0,13,27,41,55) or skip a specific slot (0,10,30,40,50 — skipping :20). Use */10 when the alignment is intentional and a list when you need irregular fires.",
      },
      {
        question: "How many times per day does an every-10-minutes cron job run?",
        answer:
          "144 times: six fires per hour (at :00, :10, :20, :30, :40, :50) across 24 hours. In a 31-day month that is 4,464 executions — a number worth knowing when you are budgeting API quota (144 daily calls against a per-endpoint limit), database load, or log volume. Each execution writing 10 log lines produces 1,440 lines a day from one job.",
      },
    ],
  },
  "every-30-minutes": {
    sections: [
      {
        heading: "Half-hourly: the half-way house",
        body: [
          "*/30 * * * * fires twice an hour at :00 and :30 — 48 runs a day — and it hosts the work that wants to be 'fairly fresh' without polling overhead: RSS and feed aggregation, metrics snapshot jobs between finer-grained scrapes, API token and session refreshes with 30-minute validity, price or inventory syncs, and CRM-to-warehouse reconciliation. At 48 executions a day, even a job costing several seconds is operationally invisible, which is why half-hourly is often chosen as the de-escalation cadence when an every-minute poll proves excessive.",
          "The :00/:30 alignment shares the top-of-hour collision problem with hourly jobs — half the fires land exactly when the world's batch jobs fire. 7-59/30 shifts to :07/:37; 5 and 35 gives :05/:35 by list form. The list form is worth knowing here specifically because */30's two-fire symmetry makes it the easiest cadence to hand-place: 12,42 is the same interval with the phase moved out of everyone's way. The offset variants in this directory cover the common choices.",
        ],
      },
      {
        heading: "Half-hourly on timers, CronJobs, and EventBridge",
        body: [
          "systemd: OnCalendar=*:0/30, or the more readable *-*-* *:00,30:00 form; both fire at :00 and :30. Kubernetes: \"*/30 * * * *\" verbatim — at 48 runs a day, the CronJob history settings are the main hygiene item, since default retention accumulates thousands of job objects a month on busy clusters. AWS EventBridge: cron(0/30 * * * ? *) in its 6-field form — with the standing EventBridge caveats that evaluation is UTC-only and the day fields require '?' in one position.",
          "For long-running half-hourly work, the platform-native pattern beats a bare timer: EventBridge → Step Functions for anything with multi-step retry; Cloudflare Cron Triggers for edge-side freshness; Celery beat (crontab(minute='*/30')) for in-process tasks. The choice among wrappers is about observability and retries, not the schedule — the five fields above are identical in all of them.",
        ],
      },
    ],
    extraFaqs: [
      {
        question: "Does */30 mean every 30 minutes or every 30 hours?",
        answer:
          "Every 30 minutes. A step value applies within a single field and never crosses field boundaries: */30 in the minute field means minute 0 and minute 30 of every hour — 48 fires a day. The same */30 in the hour field would mean hour 0 only (30 is outside the 0-23 hour range), firing once a day at midnight — a real copy-paste bug when the minute and hour positions get swapped. Field position determines meaning; the breakdown table above keeps every field labeled.",
      },
      {
        question: "How do I run every 30 minutes offset from the hour, like at :10 and :40?",
        answer:
          "Use a list: 10,40 * * * * fires at :10 and :40. The step form 10-59/30 also works — starting at minute 10, stepping 30 within the 10-59 range gives :10 and :40. This offset pattern is the polite-scheduling move that avoids the :00/:30 batch collisions; the every-15-minutes-offset recipe in this directory demonstrates the same technique at a finer cadence.",
      },
    ],
  },
  "daily-at-8am": {
    sections: [
      {
        heading: "8 AM daily: pre-office warmups and early reports",
        body: [
          "0 8 * * * sits an hour before the typical workday: overnight-build summaries ready for the morning standup, pre-office cache and search-index warmups so 9 AM traffic arrives warm, daily digest emails with an 8 AM send time that lands near the top of the inbox, and financial closeouts stamped with an 8 AM date boundary. Scheduling at 8 rather than 9 gives the job an hour of runway — a report that occasionally runs 40 minutes still lands before its readers do, which is the margin that separates 'morning report' from 'apology email'.",
          "As with every business-hour schedule, the timezone question is the real work: 8 AM is a wall-clock concept and cron reads the machine's clock. 8 AM IST is 02:30 UTC; 8 AM US Eastern is 12:00/13:00 UTC; 8 AM CET is 07:00/08:00 UTC. On a UTC server the expression must encode the converted time, and any DST-observing target zone needs either a per-zone schedule, a scheduler with timezone support, or an hourly job with zone logic inside. The simulator's timezone picker shows the fire times for whichever zone the job is actually meant for.",
        ],
      },
      {
        heading: "Running the 8 AM job on schedulers that scale",
        body: [
          "For multi-timezone products the architecture beats the expression: a scheduler-native daily trigger (EventBridge cron(0 8 * * ? *), Kubernetes \"0 8 * * *\" with timeZone set since 1.27, Vercel's once-daily cron) fires one job that computes the recipient list and per-zone send times, then dispatches. That single 8 AM trigger becomes '8 AM wherever each user is' without 200 cron lines — and the timezone logic is testable code rather than crontab archaeology.",
          "The reporting jobs at this hour share one operational duty: they are the first thing that breaks visibly when upstream data is late. An 8 AM report that reads yesterday's warehouse tables inherits the warehouse's SLA — if the ETL slipped, the report faithfully publishes wrong numbers on time. The reliable pattern is a data-freshness check at job start (watermark timestamp) with a fail-fast-and-alert path, so the 8 AM job is the alarm for upstream delay rather than its cover-up.",
        ],
      },
    ],
    extraFaqs: [
      {
        question: "How do I write 8 AM local time if my server runs UTC?",
        answer:
          "Convert the wall time to UTC and encode it. 8 AM IST (UTC+5:30) is 30 2 * * * in UTC; 8 AM US Eastern is 0 12 * * * UTC in winter, 0 13 * * * in summer; 8 AM CET is 0 7 * * * UTC in winter, 0 6 * * * in summer. A fixed line cannot follow DST — use cronie's CRON_TZ, Kubernetes' timeZone field, Quartz's timezone property, or schedule hourly with in-job zone checks. The simulator above with the timezone picker computes the conversion for any zone.",
      },
      {
        question: "Should the daily report job run at 8 AM or midnight when data arrives overnight?",
        answer:
          "Run it as late as safely possible before readers arrive — 8 AM beats midnight because overnight ETL has a full window to finish, and the report reads fresh data rather than racing it. Keep a freshness check at job start: verify the upstream watermark (last successful load time) and fail loudly if it is stale, because an on-time report built on late data is worse than a late report. Midnight scheduling makes sense only when the job must not collide with anything else on the box.",
      },
    ],
  },
  "every-monday-at-9am": {
    sections: [
      {
        heading: "Monday 9 AM: the weekly kickoff trigger",
        body: [
          "0 9 * * 1 fires once a week — 52 times a year — and hosts the kickoff workload: weekly metric digests and business-review reports, sprint-start automation (board resets, ticket rotations), Monday standup-bot summaries, weekly newsletter generation, and database maintenance windows light enough for business hours (index rebuilds on replicas, VACUUM ANALYZE). At one fire a week the runtime budget is nearly unlimited — a job may run an hour without anyone noticing — but the blast radius of a miss is maximal: a skipped weekly job is invisible until someone asks where Monday's numbers are, a week later.",
          "That miss-visibility asymmetry defines the operational duty: weekly jobs need success alerting far more than daily ones, because cron's default silence compounds over seven days. It also makes the DST arithmetic matter more — 9 AM Monday in a DST zone moves twice a year relative to UTC, and a UTC-encoded 'correction' drifts the other way. The Monday field itself is the classic off-by-one: day 1 is Monday (Sunday is 0 or 7), and 0 9 * * 1 miswritten as 0 9 * * 0 quietly becomes a Sunday job nobody reads.",
        ],
      },
      {
        heading: "Weekly schedules with day names across platforms",
        body: [
          "Names kill the off-by-one: most modern cron implementations, Quartz, EventBridge, and Celery all accept MON (or Monday in some) in the day-of-week field — 0 9 * * MON reads the way it fires. Kubernetes takes \"0 9 * * 1\" with the same numbering and, since 1.27, a timeZone field to pin the 9 AM. AWS EventBridge writes it cron(0 9 ? * MON *) — six fields, '?' mandatory in one day position, UTC only. Celery beat: crontab(hour=9, day_of_week='monday') in the schedule dictionary.",
          "For 'last Monday of the month' and 'every other Monday' variants — questions every weekly schedule eventually attracts — plain cron cannot express them: the day-of-week field has no ordinal, no parity. The platform answers: Quartz (2#1 style ordinals, see this directory's first-Monday recipe), EventBridge's L/W modifiers, or the standard job-side guard (wake Monday, check the date, maybe exit). The weekly field table above covers what cron can say; the rest is architecture.",
        ],
      },
    ],
    extraFaqs: [
      {
        question: "Is Monday day 1 or day 0 in cron?",
        answer:
          "Monday is 1. Cron's day-of-week field counts 0 = Sunday (7 is also Sunday in most implementations), 1 = Monday, through 6 = Saturday — so 0 9 * * 1 is Monday at 9 AM and 0 9 * * 0 is Sunday, the classic wrong-weekday bug. Most modern cron implementations also accept names: 0 9 * * MON fires identically and cannot be miscounted. Quartz flips the convention — in Quartz, 1 = Sunday and 2 = Monday — which is the trap when moving schedules between the two (see the platform-specific recipes).",
      },
      {
        question: "How do I run a job every other Monday?",
        answer:
          "Standard cron cannot express fortnightly parity — there is no 'week number' concept in the five fields. The three workarounds: have the job keep state (touch a timestamp file or database row and exit unless 13+ days have passed — scheduled 0 9 * * 1); compute ISO week parity inside the job (odd/even week numbers, with the caveat that ISO weeks and calendar years misalign at boundaries); or use a scheduler with richer triggers — Quartz calendars, EventBridge with a state-machine guard, or Airflow with a custom schedule. The state-file pattern is the most portable and the most debuggable.",
      },
    ],
  },
  "first-day-of-month": {
    sections: [
      {
        heading: "Month-start jobs: billing, closeouts, and retention",
        body: [
          "0 0 1 * * fires at midnight on the first of every month, and its workload is the calendar-driven core of the business: billing runs and invoice generation, subscription renewals and quota resets, monthly report snapshots (the 1st is the natural 'as of' boundary), data-warehouse partition rotation, and retention enforcement that deletes the month of data now past its window. Month-start differs from every other cadence in one structural way: the interval between fires is 28, 29, 30, or 31 days — variable — which breaks every naive 'days since last run' calculation a job might do.",
          "February is the stress test. A job assuming 30-day months drifts every month; a billing job that prorates on 'days in period' must ask the calendar how long the period actually was (28 in common years, 29 in leap years, and leap-year logic itself is a known bug farm). The 1st also collides with the weekend problem: a month starting Saturday means billing and reports land in empty inboxes, which is why many teams schedule the business action for the 1st but deliver notifications on the first business day — a policy the job implements, not the cron line.",
        ],
      },
      {
        heading: "Month-start across schedulers — and the last-day problem",
        body: [
          "Every platform expresses the first of the month directly: 0 0 1 * * in cron and Kubernetes; cron(0 0 1 * ? *) in EventBridge; OnCalendar=*-*-01 00:00:00 in systemd; crontab(day_of_month='1') in Celery. The interesting sibling problem is the LAST day of the month, which five-field cron cannot express (there is no 31st in every month) — Unix workarounds use the 28-31 guard-day pattern (see this directory's month-end-guard recipe), while Quartz, EventBridge, and CloudWatch scheduled expressions all have a native L modifier. If your job is really a month-end job, the L-bearing dialects are the honest answer.",
          "Month-start jobs are also the natural home of the idempotency discipline: they run rarely, touch money, and will inevitably be re-run manually after a bad deploy. The reliable pattern is a run ledger — one row per (job, month) with status — written before work begins, so a re-run resumes or refuses cleanly instead of double-billing. Cron guarantees the schedule; only the job can guarantee the semantics, and monthly is the cadence where that distinction pays rent.",
        ],
      },
    ],
    extraFaqs: [
      {
        question: "How do I run a cron job on the last day of every month?",
        answer:
          "Standard five-field cron cannot — day-of-month 31 does not exist in every month, and there is no 'last day' token. The Unix workaround is the guard-day pattern: schedule on days 28-31 (0 0 28-31 * *) and have the job check whether tomorrow is the 1st, exiting early if not — see this directory's month-end-guard recipe for the exact form. Quartz and AWS EventBridge support a native L: 0 0 L * ? in Quartz fires on the last day directly, making them the cleaner answer when the dialect is yours to choose.",
      },
      {
        question: "Does 0 0 1 * * run at midnight or at 1 AM?",
        answer:
          "Midnight at the start of the 1st: minute 0, hour 0, day-of-month 1 — 00:00 on the first of each month. The day field here is day-of-MONTH (1-31), not day-of-week; the two day fields occupy positions 3 and 5 respectively, and mixing them up turns a monthly job into a weekly one (0 0 * * 1 is Monday). The field table above labels each position explicitly, and the simulator's next-run list confirms you are looking at monthly fires.",
      },
    ],
  },
};

export function getRecipeDeepContent(slug: string): RecipeDeepContent | undefined {
  return RECIPE_DEEP_CONTENT[slug];
}

export function deepContentSlugs(): string[] {
  return Object.keys(RECIPE_DEEP_CONTENT);
}

export function deepContentRecipe(slug: string): CronRecipe | undefined {
  return getRecipe(slug);
}

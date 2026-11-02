"use client";

import * as React from "react";
import { Tabs, TabPanel, type TabItem } from "@/components/ui/tabs";
import { formatCount } from "@/lib/salesforce-log/format";
import type { DebugLogAnalysis } from "@/lib/salesforce-log/types";
import { DebugsPanel } from "./DebugsPanel";
import { DmlPanel } from "./DmlPanel";
import { ErrorsPanel } from "./ErrorsPanel";
import { LimitsPanel } from "./LimitsPanel";
import { NPlusOnePanel } from "./NPlusOnePanel";
import { SoqlPanel } from "./SoqlPanel";
import { SummaryPanel } from "./SummaryPanel";

export type AnalyzerTabId =
  | "summary"
  | "nplusone"
  | "limits"
  | "soql"
  | "dml"
  | "debugs"
  | "errors";

function CountPill({ count }: { count: number }) {
  return (
    <span className="rounded-full bg-zinc-950/70 px-1.5 py-0.5 text-[11px] font-semibold leading-none text-zinc-400 tabular-nums">
      {formatCount(count)}
    </span>
  );
}

function TabLabel({ label, count }: { label: string; count: number }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      {label}
      <CountPill count={count} />
    </span>
  );
}

export type AnalyzerTabsProps = {
  analysis: DebugLogAnalysis;
};

/** Tabbed results shell: Summary, N+1, Limits, SOQL, DML, Debugs, Errors. */
export function AnalyzerTabs({ analysis }: AnalyzerTabsProps) {
  const [tab, setTab] = React.useState<AnalyzerTabId>("summary");

  const limitCount = analysis.limits.reduce(
    (total, namespace) => total + namespace.entries.length,
    0,
  );

  const tabs: TabItem[] = [
    { value: "summary", label: "Summary" },
    {
      value: "nplusone",
      label: <TabLabel label="N+1" count={analysis.nPlusOne.length} />,
    },
    { value: "limits", label: <TabLabel label="Limits" count={limitCount} /> },
    {
      value: "soql",
      label: <TabLabel label="SOQL" count={analysis.counts.soqlQueries} />,
    },
    {
      value: "dml",
      label: <TabLabel label="DML" count={analysis.counts.dmlStatements} />,
    },
    {
      value: "debugs",
      label: <TabLabel label="Debugs" count={analysis.counts.userDebugLines} />,
    },
    {
      value: "errors",
      label: <TabLabel label="Errors" count={analysis.errors.length} />,
    },
  ];

  return (
    <div>
      <Tabs
        idPrefix="sfdla"
        tabs={tabs}
        value={tab}
        onValueChange={(value) => setTab(value as AnalyzerTabId)}
        aria-label="Analysis views"
        className="flex w-full overflow-x-auto sm:w-auto"
      />
      <TabPanel idPrefix="sfdla" value="summary" activeValue={tab} className="p-4 sm:p-5">
        <SummaryPanel analysis={analysis} />
      </TabPanel>
      <TabPanel idPrefix="sfdla" value="nplusone" activeValue={tab} className="p-4 sm:p-5">
        <NPlusOnePanel analysis={analysis} />
      </TabPanel>
      <TabPanel idPrefix="sfdla" value="limits" activeValue={tab} className="p-4 sm:p-5">
        <LimitsPanel analysis={analysis} />
      </TabPanel>
      <TabPanel idPrefix="sfdla" value="soql" activeValue={tab} className="p-4 sm:p-5">
        <SoqlPanel analysis={analysis} />
      </TabPanel>
      <TabPanel idPrefix="sfdla" value="dml" activeValue={tab} className="p-4 sm:p-5">
        <DmlPanel analysis={analysis} />
      </TabPanel>
      <TabPanel idPrefix="sfdla" value="debugs" activeValue={tab} className="p-4 sm:p-5">
        <DebugsPanel analysis={analysis} />
      </TabPanel>
      <TabPanel idPrefix="sfdla" value="errors" activeValue={tab} className="p-4 sm:p-5">
        <ErrorsPanel analysis={analysis} />
      </TabPanel>
    </div>
  );
}

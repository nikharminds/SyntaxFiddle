"use client";

import * as React from "react";
import { convertId, convertIds } from "@/lib/salesforce-id-converter/engine";
import type { ConvertIdResult } from "@/lib/salesforce-id-converter/engine";

export function useSalesforceIdConverter(initialId = "", initialBulk = "") {
  const [id, setId] = React.useState(initialId);
  const [bulk, setBulk] = React.useState(initialBulk);

  const single = React.useMemo<ConvertIdResult | null>(
    () => (id.trim().length === 0 ? null : convertId(id)),
    [id]
  );

  const bulkResults = React.useMemo<ConvertIdResult[]>(
    () => (bulk.trim().length === 0 ? [] : convertIds(bulk)),
    [bulk]
  );

  const clearSingle = React.useCallback(() => setId(""), []);
  const clearBulk = React.useCallback(() => setBulk(""), []);

  return { id, setId, bulk, setBulk, single, bulkResults, clearSingle, clearBulk };
}

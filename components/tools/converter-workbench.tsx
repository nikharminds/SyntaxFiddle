"use client";

import { ConverterLayout } from "@/components/converter/ConverterLayout";
import type { TranspileTarget } from "@/lib/curl";
import type { SchemaTarget } from "@/lib/json-schema";
import { CurlConverterWorkspace } from "./curl-converter/workspace";
import { JsonConverterWorkspace } from "./json-converter/workspace";

const CURL_TARGET_BY_SLUG: Record<string, TranspileTarget> = {
  "curl-to-salesforce-apex": "apex",
  "curl-to-python-requests": "python",
  "curl-to-javascript-fetch": "fetch",
};

const SCHEMA_TARGET_BY_SLUG: Record<string, SchemaTarget> = {
  "json-to-zod": "zod",
  "json-to-pydantic": "pydantic",
};

export type ConverterWorkbenchProps = {
  slug: string;
  toolType: "curl" | "schema" | "csv";
  preloadedInput: string;
};

export function ConverterWorkbench({ slug, toolType, preloadedInput }: ConverterWorkbenchProps) {
  if (toolType === "curl") {
    return (
      <CurlConverterWorkspace
        initialTarget={CURL_TARGET_BY_SLUG[slug] ?? "fetch"}
        initialCommand={preloadedInput}
      />
    );
  }

  if (toolType === "schema") {
    return (
      <JsonConverterWorkspace
        defaultTab={SCHEMA_TARGET_BY_SLUG[slug] ?? "zod"}
        initialJson={preloadedInput}
      />
    );
  }

  return (
    <ConverterLayout
      initialSource="csv"
      initialTarget="soql-in"
      initialText={preloadedInput}
      initialOptions={{ soqlColumn: "email", soqlField: "Email" }}
    />
  );
}

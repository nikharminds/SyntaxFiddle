import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  buildPairMetadata,
  ConversionLanding,
} from "@/components/converter/ConversionLanding";
import { getConversionPair } from "@/lib/converter/routes";

const pair = getConversionPair("sql-to-csv");

if (!pair) notFound();

export const metadata: Metadata = buildPairMetadata(pair);

const resolvedPair = pair;

export default function Page() {
  return <ConversionLanding pair={resolvedPair} />;
}

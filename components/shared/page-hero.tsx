import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

export type PageHeroFact = {
  icon: LucideIcon;
  title: string;
  description: string;
};

export type PageHeroProps = {
  badges: React.ReactNode;
  title: React.ReactNode;
  description: React.ReactNode;
  facts: PageHeroFact[];
};

export function PageHero({ badges, title, description, facts }: PageHeroProps) {
  return (
    <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div>
        <div className="flex flex-wrap items-center gap-2">{badges}</div>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-zinc-100 sm:text-4xl">
          {title}
        </h1>
        <p className="mt-3 text-base leading-7 text-zinc-400">{description}</p>
      </div>
      <Card className="w-full max-w-sm border-zinc-800 bg-zinc-900/60 p-5 lg:justify-self-end">
        <ul className="space-y-4">
          {facts.map((fact) => (
            <li key={fact.title} className="flex gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-500/10">
                <fact.icon size={15} className="text-emerald-400" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-zinc-200">{fact.title}</p>
                <p className="mt-0.5 text-xs leading-5 text-zinc-500">{fact.description}</p>
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

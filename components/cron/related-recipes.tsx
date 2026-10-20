import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import {
  CATEGORY_LABELS,
  RECIPES_BY_SLUG,
  type CronRecipe,
  type RecipeCategory,
} from "@/lib/cron/recipes";

export type RelatedRecipesProps = {
  slugs: string[];
  currentSlug?: string;
};

export function RelatedRecipes({ slugs, currentSlug }: RelatedRecipesProps) {
  const recipes = slugs
    .map((slug) => RECIPES_BY_SLUG.get(slug))
    .filter((recipe): recipe is CronRecipe => recipe !== undefined && recipe.slug !== currentSlug);

  const groups = new Map<RecipeCategory, CronRecipe[]>();
  for (const recipe of recipes) {
    const list = groups.get(recipe.category) ?? [];
    list.push(recipe);
    groups.set(recipe.category, list);
  }

  if (recipes.length === 0) return null;

  return (
    <section aria-labelledby="related-heading" className="mt-14">
      <h2 id="related-heading" className="text-xl font-bold tracking-tight text-zinc-100">
        Related cron expressions
      </h2>
      <p className="mt-2 text-sm text-zinc-400">
        Adjacent intervals and the same schedules expressed for other platforms.
      </p>
      <div className="mt-5 space-y-7">
        {[...groups.entries()].map(([category, categoryRecipes]) => (
          <div key={category}>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
              {CATEGORY_LABELS[category]}
            </h3>
            <ul className="mt-3 grid list-none gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {categoryRecipes.map((recipe) => (
                <li key={recipe.slug}>
                  <Card hover className="h-full">
                    <Link
                      href={`/cron/${recipe.slug}/`}
                      className="flex h-full flex-col gap-2 p-4 focus-visible:outline-none"
                    >
                      <code className="w-fit rounded-md border border-zinc-800 bg-zinc-950 px-2 py-1 font-mono text-xs text-emerald-400">
                        {recipe.expression}
                      </code>
                      <span className="text-sm font-medium text-zinc-200">{recipe.title}</span>
                      <span className="mt-auto inline-flex items-center gap-1 text-xs font-medium text-emerald-400">
                        View reference
                        <ArrowRight size={12} />
                      </span>
                    </Link>
                  </Card>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export function PrivacyNote({ className }: { className?: string }) {
  return (
    <div
      role="note"
      aria-label="Privacy guarantee"
      className={cn(
        "flex items-start gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 sm:p-5",
        className,
      )}
    >
      <ShieldCheck size={20} className="mt-0.5 shrink-0 text-emerald-400" />
      <p className="text-sm leading-6 text-emerald-100/90">
        <strong className="font-semibold text-emerald-300">
          100% Client-Side Execution:
        </strong>{" "}
        Your files, database rows, and customer data are processed entirely in
        local browser memory. Zero bytes are uploaded to any server or external
        API.
      </p>
    </div>
  );
}

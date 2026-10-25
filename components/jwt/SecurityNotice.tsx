export function SecurityNotice() {
  return (
    <div
      role="note"
      aria-label="Security notice"
      className="flex items-start gap-3 rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4 sm:p-5"
    >
      <span aria-hidden className="text-lg leading-none">
        🛡️
      </span>
      <p className="text-sm leading-6 text-emerald-200">
        <strong className="font-semibold text-emerald-300">Security Notice:</strong>{" "}
        This decoder runs 100% in your local browser. Your tokens are NEVER sent
        to a server. You can disable your Wi-Fi, and this tool will still work.
      </p>
    </div>
  );
}

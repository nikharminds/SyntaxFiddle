# Security Policy

## Privacy by architecture

SyntaxFiddle is a fully static application. Every tool — cron parsing, file conversion,
regex evaluation, JWT decoding — executes inside your browser. No input data, telemetry,
or personal information is ever transmitted to any server. You can verify this by
watching the network panel in your browser's devtools after any page loads.

## Reporting a vulnerability

We take security seriously, even for a client-side application (XSS, ReDoS, dependency
vulnerabilities, and prototype pollution in parsers are all in scope).

Please use
[GitHub's private vulnerability reporting](https://github.com/nikharminds/SyntaxFiddle/security/advisories)
to disclose issues responsibly. Please avoid opening public issues for suspected
security problems.

Include where possible: the affected URL, a minimal reproducer, browser/OS version, and
impact assessment.

## Scope

- All code served from `syntaxfiddle.com`
- This repository's build pipeline and dependencies

Out of scope: social engineering, rate limiting, issues in outdated browser versions.

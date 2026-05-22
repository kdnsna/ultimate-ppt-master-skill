# Security Policy

## Supported Versions

Security fixes target the latest released version on the `main` branch.

## Reporting A Vulnerability

Please do not open a public issue for secrets, private documents, local path leaks, or provider-key exposure.

Report privately to the maintainer through GitHub by opening a security advisory when available, or by contacting the repository owner directly. Include:

- affected version or commit;
- the local command or workflow involved;
- what data could be exposed;
- a minimal reproduction without private files or keys.

## Project Security Principles

- Bridge is designed for localhost workflows.
- API keys should stay in local `.env` files and must not be committed.
- Public examples must be sanitized.
- Generated handoff folders may contain sensitive source material and should be shared carefully.

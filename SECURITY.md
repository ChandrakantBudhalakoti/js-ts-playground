# Security policy

CodeTakhti runs untrusted code in the browser, so its sandbox is the
most security-sensitive part of the project. The isolation model is described
in [the README](README.md#security-model-and-production-setup).

## Reporting a vulnerability

Please **don't open a public issue**. Report it privately with GitHub's
[private vulnerability reporting](https://github.com/ChandrakantBudhalakoti/js-ts-playground/security/advisories/new)
(the "Report a vulnerability" button on the repository's Security tab).

Useful details:

- what an attacker can do (for example, code in the sandbox reading the app's
  storage, or a share link running code without the user pressing Run)
- the smallest code or share link that demonstrates it
- the browser and version you tested

Reports are handled as quickly as possible. Fixes go into `main` and are
deployed from there; only the latest deployment is supported.

## In scope

- Escaping the sandbox iframe or its Web Worker
- A language runtime (Python, Ruby, PHP, Go, Lua, R or a compiled C/C++
  program) reaching the network or the app from the sandbox
- Code compiled by Clang affecting the app, although Clang runs in the app's
  own worker
- Bypassing the Content Security Policy of the app or of `/sandbox`
- Messages from the sandbox being accepted when they should be rejected
- Console output being rendered as HTML
- Share links or examples that execute code without user action

Problems that require a compromised browser or a malicious browser extension
are out of scope.

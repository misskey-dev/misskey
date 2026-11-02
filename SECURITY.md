# Security Policy

## Reporting Security Issues

If you discover a security issue in Misskey, please report it by **[this form](https://github.com/misskey-dev/misskey/security/advisories/new)**.

This will allow us to assess the risk, and make a fix available before we add a
bug report to the GitHub repository.

**Please do not report security issues via public Issues, Pull Requests, or Discussions.**

Thanks for helping make Misskey safe for everyone.

> [!note]
> CNA [requires](https://www.cve.org/ResourcesSupport/AllResources/CNARules#section_5-2_Description) that CVEs include a description in English for inclusion in the CVE Catalog.
>
> When creating a security advisory, all content must be written in English (it is acceptable to include a Japanese description along with the English one).

## Supported Versions

| Version | Supported |
| --- | --- |
| Latest stable release | :white_check_mark: |
| Older stable releases | :x: |
| Pre-releases (alpha / beta / rc) | See below |

- In principle, only the **latest stable release** is supported.
- Whether a report is in scope is determined by whether it affects the latest stable release, not by when the vulnerability was introduced. Vulnerabilities introduced in older versions are in scope as long as they are still reproducible in the latest stable release.
- Fixes are provided only for the latest stable release; we do not backport fixes to older versions.
- If a vulnerability was introduced in a pre-release and that pre-release **has already been published**, you may report it via the security advisory form. In this case, however, it may be handled as a regular bug fix without publishing a security advisory (and thus without a CVE).
- If a vulnerability exists only in unreleased code (e.g. the `develop` branch, not yet included in any published release or pre-release), you may report it via a regular Issue or Pull Request.

## Scope

### In scope

This policy covers the following components, which are maintained in this repository:

- Misskey: all components that run as part of a Misskey server or are delivered to its users (e.g. `packages/backend`, `packages/frontend`, `packages/frontend-embed`, `packages/sw`, and the shared packages they depend on)
- `misskey-js` (`packages/misskey-js`)
- The official Docker image (built from the `Dockerfile` in this repository)

Vulnerabilities in other libraries or tools (including those maintained by misskey-dev or aiscript-dev, such as AiScript, summaly, or the media proxy) should be reported to their respective repositories.

Issues specific to forks of Misskey, or to the configuration or operation of a particular server, are not covered by this policy. Please contact the developers of the fork or the administrators of the server.

#### Development tools and CI/CD

Development tools and CI/CD (e.g. `scripts/`, `.github/workflows/`, `packages-private/`, and packages under `packages/` used only for development or building) are in scope **only if they can be exploited by a third party against this repository or its distribution**, for example:

- A Pull Request from a fork can leak secrets, obtain write access to this repository, or execute arbitrary code in a privileged context
- Release artifacts (e.g. Docker images, the npm package of `misskey-js`) can be tampered with

Other issues, such as those that only affect the local environment of a developer running the tools, are treated as regular bugs; please report them via Issues.

### Out of scope

The following are generally **not** considered vulnerabilities. Some of them may still be reported as regular bugs via Issues.

- **Behavior in non-production environments.** Checks (e.g. rate limits, CAPTCHA) may be bypassed when not running in production mode. Checks not applied correctly in production **are** in scope.
- **Bypasses of the "Lockdown" features** (e.g. "Require sign-in to view contents"). These features only *hide* content and do not guarantee strict protection. Please report bypasses via Issues; maintainers will decide whether they are bugs.
- **Remote servers not respecting visibility settings, deletion requests, etc.** This is a limitation of federation. (Tampering with local data or affecting local users through crafted activities **is** in scope.)
- **Lack of sanitization in content configured by administrators of their own server** (e.g. arbitrary HTML/JavaScript in the server description). Administrators are trusted, and this is intentional; suggestions to sanitize such content as a defense-in-depth measure are not considered vulnerabilities. (It **is** in scope if non-administrators can set such content, or if such content is executed on other servers, e.g. via federation.)
- **Behavior of plugins installed by the user.** Plugins run with the privileges the user grants them.
- **Vulnerabilities in the AiScript runtime itself.** Please report them to the [AiScript repository](https://github.com/aiscript-dev/aiscript). Sandbox escapes caused by Misskey's own implementation **are** in scope.
- **Denial of service via many requests to endpoints meant to be called frequently** (e.g. typeahead suggestions), unless the processing is unreasonably heavy for its purpose, or the requests expose or change more than the endpoint is intended to.
- **Vulnerabilities in dependencies (including the Docker base image and OS packages) that are fixed simply by updating them**, even if exploitable through Misskey. Maintainers update dependencies regularly, so there is usually no need to report them unless they are critical (e.g. remote code execution through Misskey). Scanner output (e.g. Trivy, Dockle) alone is never considered a vulnerability.
- **Server misconfiguration** (e.g. loosening `allowedPrivateNetworks`), and insecure defaults that do not lead to an exploitable condition.
- **Insecure values in example configuration files** (e.g. `compose_example.yml`, `.config/example.yml`). Administrators are expected to review them and adjust them appropriately before setting up their server; please report such values via Issues.

### Privilege escalation and permission issues

Privilege escalation, and operations that regular users, moderators, or users without the relevant role policy should not be able to perform, **are** in scope.

However, some permission settings may be intentional. Before reporting, please investigate the background (e.g. the related code, commit history, Issues, and Pull Requests) to determine:

1. whether the behavior is intentional, and
2. if so, whether the intention itself is reasonable.

If the behavior is intentional, the intention is reasonable, and it is unlikely to cause any harm beyond what was intended, it is considered a specification, not a vulnerability.

If you are still unsure after investigating, you may report it, but please include what you investigated and why you could not reach a conclusion.

## Before Reporting

A missing check in a single code path is not necessarily a vulnerability. The same protection may be enforced elsewhere (e.g. data that should not be exposed may never be stored or indexed in the first place, or may be filtered when it is serialized).

Before reporting, please confirm that the issue is actually exploitable end-to-end, preferably by reproducing it on a running server on your own environment. Reports based only on reading part of the code may be closed if the issue cannot be reproduced.

However, if the protection elsewhere appears to work only by coincidence rather than by design (e.g. it could easily be removed by commenting out a few lines or by an unrelated change), you may still report it. In that case, a working proof of concept is not required, but please explain why you think the protection is not intentional.

## What to Include in a Report

To help us triage your report quickly, please include:

- Steps to reproduce
- Impact (what an attacker can do, and to whom)
- Preconditions (required privileges, settings, etc.)
- (Strongly recommended) A proof of concept **with the actual result observed in your environment** (e.g. the actual request and response). A hypothetical proof of concept showing only the expected result is not sufficient.
- (Optional) Affected version(s) or commit(s)
- (Optional) A suggested CVSS vector and CWE

## Testing Guidelines

- **Do not test against servers you do not own** (e.g. public Misskey servers) without permission from their administrators. Please use your own local or test environment.
- If you are testing a vulnerability related to federation, please do so only on your own local or isolated test environment, not on the servers connected to the public federation.
- Do not access, modify, or delete other users' data, and do not perform tests that may disrupt services.

## Reports Using AI Tools / Automated Scanners

We have seen a significant increase in reports generated by AI tools and automated scanners.

You may use such tools to find issues, but **before submitting a report, a human must verify that it is a real vulnerability**, for example by reading and examining the actual code, or by reproducing it on a running server. Reports that have not been verified by a human may be closed without further investigation.

AI agents must not submit security reports on their own.

## Response Process

Misskey is maintained by volunteers. We try to respond as quickly as possible, but it may take some time. In particular, due to the recent significant increase in reports (including those found by AI-based vulnerability scanning), responses may be delayed.

After a fix is released, we publish the security advisory in the following steps. The timeframes below are rough guidelines and may vary.

1. **Advance notice**: About one week after the fixed version is released, we publish a brief advisory without technical details.
2. **Full disclosure**: Once a reasonable number of servers, especially those with a large number of users, have updated to the fixed version, and we judge that the potential impact has become sufficiently small in terms of the number of users actually affected, we publish the full details.

Please do not disclose the details of the vulnerability publicly until the full advisory has been published.

## Credits and Bug Bounty

- Reporters are credited using GitHub's security advisory credit feature.
- Misskey does **not** offer a bug bounty program.

## When Creating a Patch

If you can also create a patch to fix the vulnerability, please create a PR on the private fork.

> [!note]
> If a pull request does not have a linear history relative to the current `develop` branch, it may not merge successfully. If conflicts occur, please resolve them by rebasing rather than creating a merge commit.

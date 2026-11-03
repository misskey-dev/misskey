# Contribution guide
We're glad you're interested in contributing Misskey! In this document you will find the information you need to contribute to the project.

> [!NOTE]
> This project uses Japanese as its major language, **but you do not need to translate and write the Issues/PRs in Japanese.**
> Also, you might receive comments on your Issue/PR in Japanese, but you do not need to reply to them in Japanese as well.\
> The accuracy of machine translation into Japanese is not high, so it will be easier for us to understand if you write it in the original language.
> It will also allow the reader to use the translation tool of their preference if necessary.

## Guides

Choose the guide for your task.

| Task | Guide |
| --- | --- |
| Set up and run a development environment | [Development](docs/contributing/development.md) |
| Validate changes and write tests | [Testing](docs/contributing/testing.md) |
| Follow coding conventions and design principles | [Coding guidelines](docs/contributing/coding-guidelines.md) |
| Change the frontend | [Frontend](docs/contributing/frontend.md) |
| Change the backend or database | [Backend](docs/contributing/backend.md) |
| Change ActivityPub payloads | [ActivityPub](docs/contributing/activitypub.md) |
| Triage issues, review changes, deploy or release | [Maintainer guide](docs/contributing/maintainer-guide.md) |

## Roadmap
See [ROADMAP.md](./ROADMAP.md)

## Issues
Before creating an issue, please check the following:
- To avoid duplication, please search for similar issues before creating a new issue.
- Do not use Issues to ask questions or troubleshooting.
	- Issues should only be used to feature requests, suggestions, and bug tracking.
	- Please ask questions or troubleshooting in [GitHub Discussions](https://github.com/misskey-dev/misskey/discussions) or [Discord](https://discord.gg/Wp8gVStHW3).

> [!WARNING]
> Do not close issues that are about to be resolved. It should remain open until a commit that actually resolves it is merged.

### Recommended discussing before implementation
We welcome your proposal.

When you want to add a feature or fix a bug, **first have the design and policy reviewed in an Issue** (if it is not there, please make one). Without this step, there is a high possibility that the PR will not be merged even if it is implemented.

At this point, you also need to clarify the goals of the PR you will create, and make sure that the other members of the team are aware of them.
PRs that do not have a clear set of do's and don'ts tend to be bloated and difficult to review.

Also, when you start implementation, assign yourself to the Issue (if you cannot do it yourself, ask Committer to assign you).
By expressing your intention to work on the Issue, you can prevent conflicts in the work.

## Well-known branches
- **`master`** branch is tracking the latest release and used for production purposes.
- **`develop`** branch is where we work for the next release.
	- When you create a PR, basically target it to this branch.
- **`l10n_develop`** branch is reserved for localization management.

## Creating a PR
Thank you for your PR! Before creating a PR, please check the following:
- If possible, prefix the title with a keyword that identifies the type of this PR, as shown below.
	- `fix` / `refactor` / `feat` / `enhance` / `perf` / `chore` etc
	- Also, make sure that the granularity of this PR is appropriate. Please do not include more than one type of change or interest in a single PR.
- If there is an Issue which will be resolved by this PR, please include a reference to the Issue in the text.
- Please add the summary of the changes to [`CHANGELOG.md`](/CHANGELOG.md). However, this is not necessary for changes that do not affect the users, such as refactoring.
- Check if there are any documents that need to be created or updated due to this change.
- If you have added a feature or fixed a bug, please add a test case if possible.
- Please make sure that tests and Lint are passed in advance.
	- You can run it with `pnpm test` and `pnpm lint`. [See more info](docs/contributing/testing.md)
- If this PR includes UI changes, please attach a screenshot in the text.

Thanks for your cooperation 🤗

For ActivityPub payload changes, see [additional requirements](docs/contributing/activitypub.md).

## Security Advisory

### For reporter
Thank you for your reporting!

If you can also create a patch to fix the vulnerability, please create a PR on the private fork.

> [!note]
> There is a GitHub bug that prevents merging if a PR not following the develop branch of upstream, so please keep follow the develop branch.

For maintainers: [handling advisories](docs/contributing/maintainer-guide.md#security-advisory).

## Localization (l10n)
Misskey uses [Crowdin](https://crowdin.com/project/misskey) for localization management.
You can improve our translations with your Crowdin account.
Your changes in Crowdin are automatically submitted as a PR (with the title "New Crowdin translations") to the repository.
The owner [@syuilo](https://github.com/syuilo) merges the PR into the develop branch before the next release.

If your language is not listed in Crowdin, please open an issue. We will add it to Crowdin.
For newly added languages, once the translation progress per language exceeds 70%, it will be officially introduced into Misskey and made available to users.

![Crowdin](https://d322cqt584bo4o.cloudfront.net/misskey/localized.svg)

# Contribution guide
:v: Thanks for your contributions :v:

**ℹ️ Important:** This project uses Japanese as its major language, **but you do not need to translate and write the Issues/PRs in Japanese.**
Also, you might receive comments on your Issue/PR in Japanese, but you do not need to reply to them in Japanese as well.\
The accuracy of translation into Japanese is not high, so it will be easier for us to understand if you write it in the original language.
It will also allow the reader to use the translation tool of their preference if necessary.

## Issues
Before creating an issue, please check the following:
- To avoid duplication, please search for similar issues before creating a new issue.
- Do not use Issues as a question.
	- Issues should only be used to feature requests, suggestions, and report problems.
	- Please ask questions in the [Misskey Forum](https://forum.misskey.io/) or [Discord](https://discord.gg/Wp8gVStHW3).

## Before implementation
When you want to add a feature or fix a bug, first have the design and policy reviewed in an Issue (if it is not there, please make one). Without this step, there is a high possibility that the PR will not be merged even if it is implemented.

Also, when you start implementation, assign yourself to the Issue (if you cannot do it yourself, ask another member to assign you). By expressing your intention to work the Issue, you can prevent conflicts in the work.

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
  - You can run it with `npm run test` and `npm run lint`. [See more info](#testing)
- If this PR includes UI changes, please attach a screenshot in the text.

Thanks for your cooperation 🤗

## Localization (l10n)
Misskey uses [Crowdin](https://crowdin.com/project/misskey) for localization management.
You can improve our translations with your Crowdin account.
Your changes in Crowdin are automatically submitted as a PR (with the title "New Crowdin translations") to the repository.
The owner [@syuilo](https://github.com/syuilo) merges the PR into the develop branch before the next release.

If your language is not listed in Crowdin, please open an issue.

![Crowdin](https://d322cqt584bo4o.cloudfront.net/misskey/localized.svg)

## Testing
- Test codes are located in [`/test`](/test).

### Run test
```
npm run test
```

#### Run specify test
```
npx cross-env TS_NODE_FILES=true TS_NODE_TRANSPILE_ONLY=true TS_NODE_PROJECT="./test/tsconfig.json" npx mocha test/foo.ts --require ts-node/register
```

### e2e tests
TODO

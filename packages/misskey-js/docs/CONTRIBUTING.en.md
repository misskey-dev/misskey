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

## Creating a PR
Thank you for your PR! Before creating a PR, please check the following:
- If possible, prefix the title with a keyword that identifies the type of this PR, as shown below.
  - fix / refactor / feat / enhance / perf / chore etc.
  - Also, make sure that the granularity of this PR is appropriate. Please do not include more than one type of change or interest in a single PR.
- If there is an Issue which will be resolved by this PR, please include a reference to the Issue in the text.
- Please add the summary of the changes to [`CHANGELOG.md`](/CHANGELOG.md). However, this is not necessary for changes that do not affect the users, such as refactoring.
- Check if there are any documents that need to be created or updated due to this change.
- If you have added a feature or fixed a bug, please add a test case if possible.
- Please make sure that tests and Lint are passed in advance.
  - You can run it with `npm run test` and `npm run lint`.
- Run `npm run api` to update the API report and commit it if there are any diffs.

Thanks for your cooperation 🤗


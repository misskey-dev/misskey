# Contribution guide
:v: Thanks for your contributions :v:

## Issues
Feature suggestions and bug reports are filed in https://github.com/syuilo/misskey/issues .
Before creating a new issue, please search existing issues to avoid duplication.
If you find the existing issue, please add your reaction or comment to the issue.

## Localization (l10n)
Please use [Crowdin](https://crowdin.com/project/misskey) for localization.

![Crowdin](https://d322cqt584bo4o.cloudfront.net/misskey/localized.svg)

## Internationalization (i18n)
Misskey uses [vue-i18n](https://github.com/kazupon/vue-i18n).

## Documentation
* Documents for contributors are located in `/docs`.
* Documents for instance admins are located in `/docs`.
* Documents for end users are located in `src/docs`.

## Test
* Test codes are located in `/test`.

## Continuous integration
Misskey uses CircleCI for automated test.
Configuration files are located in `/.circleci`.

## Glossary
### AP
Stands for _**A**ctivity**P**ub_.

### MFM
Stands for _**M**isskey **F**lavored **M**arkdown_.

### Mk
Stands for _**M**iss**k**ey_.

### SW
Stands for _**S**ervice**W**orker_.

### Nyaize
な を にゃ にすること

#### Denyaize
Nyaizeを解除すること

## Code style
### Don't use `export default`
Bad:
``` ts
export default function(foo: string): string {
```

Good:
``` ts
export function something(foo: string): string {
```

## Directory structure
```
src ... ソースコード
	@types ... 外部ライブラリなどの型定義
	prelude ... Misskeyに関係ないかつ副作用なし
	misc ... 副作用なしのユーティリティ処理
	service ... 副作用ありの共通処理
	queue ... ジョブキューとジョブ
	server ... Webサーバー
	client ... クライアント
	mfm ... MFM

test ... テスト

```

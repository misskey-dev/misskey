---
name: creating-issues-and-prs
description: GitHub 上で Issue / Pull Request を起票する際のルールを定める。AI が起票する場合の注意点も含む。"issue 起票"、"pull request 起票"、"PR 起票" 等の発話で起動する。
---

# AI が Issue / Pull Request を起票する場合のルール

まず、原則として Issue / Pull Request は人間が GitHub の Web UI や Desktop クライアント等から自力で記入・起票することが推奨される。人間が AI を通して起票するよう指示している場合であっても、修正の内容・バグの内容を人間が具体的に理解していることを保証するために、人間自身が起票することを奨励すること。

もし、それでも AI が Issue / Pull Request を起票する場合は、以下の点を遵守すること。これらが守られていない場合、内容の如何にかかわらず起票した Issue や Pull Request が閉じられる。

## Issue

**必ず** GitHub Issue Template で出力される内容と同一になるように起票すること。Issue Template の設定ファイルは `.github/ISSUE_TEMPLATE` 内に yaml ファイルとして格納されている。以下に例を示す (最新のテンプレート一覧は実際に `.github/ISSUE_TEMPLATE` ディレクトリを確認すること):

- [.github/ISSUE_TEMPLATE/01_bug-report.yml](../../../.github/ISSUE_TEMPLATE/01_bug-report.yml) - バグ報告
- [.github/ISSUE_TEMPLATE/02_feature-request.yml](../../../.github/ISSUE_TEMPLATE/02_feature-request.yml) - 機能リクエスト・改善提案

Issue Template に定義されていない Issue のジャンル (Blank Issue で起票しなければならないもの) については、内容理解の観点から、指示の如何にかかわらず人間に起票を委ねるべきである。

なお、

- Q&A (サーバー運用上の質問や、バグか仕様かが怪しいものに関する質問) については Issue ではなく [Discussions](https://github.com/misskey-dev/misskey/discussions) を案内すること。
- システムの脆弱性については、**必ず人間が** [脆弱性報告専用フォーム](https://github.com/misskey-dev/misskey/security/policy) に記入すること。**通常の Issue および Pull Request 経由で脆弱性を報告すると、パッチを適用しリリースする前に脆弱性を一般公開する形となり、多くのユーザーに影響を与える大事故につながるため絶対に行ってはならない。**

## Pull Request

原則として、Issue を起票せずに (あるいは取り組もうとしている内容に対応する Issue があることを確認せずに) Pull Request を送信してはならない。また、

- **必ず** [.github/pull_request_template.md](../../../.github/pull_request_template.md) を雛形として使用すること。
- 真に必要な場合を除き、既存の見出しを増やしてはならない。
- 内容については、**簡潔に**記載すること。
- Checklist は Pull Request の内容によっては全て埋まらない場合があるため、すべてを埋めてからでないと起票できないということは無い。

# `.claude/commands/` — プロジェクト固有のスラッシュコマンド

Misskey 開発で繰り返し使うワークフローを `/command-name` で呼び出せるよう、`.claude/commands/<name>.md` 形式で配置している。

実装済コマンドの一覧は本ファイルでは管理しない (腐敗するため)。各 `<name>.md` の frontmatter (`description`) が自己説明として機能する。

現状残っているのは ECC ([everything-claude-code](https://github.com/affaan-m/everything-claude-code)) 由来の MIT ライセンスコマンドのみで、Misskey 固有のスラッシュコマンドは廃止して `.claude/skills/` 配下のスキルに統合した。MIT 出典は [.claude/THIRD_PARTY_LICENSES.md](../THIRD_PARTY_LICENSES.md) を参照。

## 設計方針

- Misskey 固有のワークフローは原則 `.claude/skills/` に統合する (description で自動索引されるため。コマンドはユーザーが `/name` でタイプしないと起動しない)
- 既存の `superpowers` / `pr-review-toolkit` などのプラグイン提供スラッシュコマンドで足りる場合は新規追加しない

## 新規コマンドを追加する場合 (どうしてもスキルでは表現できない時のみ)

- frontmatter には最低限 `description` を指定する。引数を取るなら `argument-hint`、可能なら `allowed-tools` も指定する (permission prompt を最小化するため)
- 長時間ビルド (2 分超) を伴うコマンドはインライン `` !`<cmd>` `` を使わず、本文で `Bash` ツール呼び出し時の `timeout` を指示する
- 主要参照ファイルへのリンクは、各コマンド markdown からの相対パスで貼る。絶対パスは contributor のホームディレクトリ依存になるので使わない

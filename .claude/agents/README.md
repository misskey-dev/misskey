# `.claude/agents/` — プロジェクト固有のサブエージェント

Misskey の特定領域に特化したレビュー / 調査エージェントを `.claude/agents/<name>.md` 形式で配置する。

frontmatter (`name` + `description` + `tools`) は、Claude が **自動でエージェントを呼び出すか判断する** 唯一の手がかりになる。`description` は **起動判断に効くドメイン・パス・ファイル種別・固有チェックに絞って簡潔に** 書く (動詞 + 対象 + トリガー条件)。本文 checklist 項目を網羅的に列挙するのではなく、他の reviewer と区別できる高シグナル語を選ぶ。

実装済エージェントの一覧は本ファイルでは管理しない (腐敗するため)。各 `<name>.md` の frontmatter が自己説明として機能する。

## 他のレビュー手段との使い分け

レビュー面を増やしすぎないよう、役割を分ける:

- **この `.claude/agents/` の 2 つ**: backend endpoint / Vue SFC の **Misskey 固有・機械的チェック** (endpoint-list 登録漏れ・misskey-js 再生成漏れ・ja-JP.yml 限定・SPDX 形式・Storybook 併設 等)。別コンテキストで差分を機械走査する価値がある領域に限定する
- **`pr-review-toolkit` プラグイン (code-reviewer / silent-failure-hunter 等)**: 言語非依存の一般的なコード品質・バグ・設計レビュー。Misskey 固有規約は見ない
- **`working-on-*` skill の checklist**: コードを **書いている最中** の自己チェック (レビュー専用ではなく実装ガイド)

Misskey 固有規約の機械チェックは本 agent、一般品質は pr-review-toolkit、実装中ガイドは skill、と棲み分ける。

## 構成方針

- `tools` は **編集権限なし** (Edit/Write を渡さない) に絞り、PR baseline (`git merge-base origin/develop HEAD`) との差分から自動的にレビュー対象を抽出する設計
- 差分抽出は `git merge-base origin/develop HEAD` を baseline にする (PR / ブランチ全体を見るため)。`git diff HEAD` 単体は **未コミット差分しか取れず、コミット済の PR では空になって誤判定する** ので使わない
- `description` は呼び出し判断の手がかりであると同時に、(呼ばれなくても) Task ツール起動のたびに常時ロードされる。**他で代替できない高シグナルなトリガー語に絞って簡潔に** 書く (汎用 reviewer と被る語や冗長な列挙は context-budget 上の overhead になるだけで発見性に寄与しない)。健全性は [/harness-audit](../commands/harness-audit.md) / [context-budget skill](../skills/context-budget/SKILL.md) で確認できる
- 規約の **正本は `.claude/skills/*/references/` 側**。agent の checklist はその **派生コピー** (subagent が skill を読まなくても動くよう自己完結させる)。規約を変えるときは references を先に直し agent を追従させる ── 両者の食い違いは同期漏れなので references を正とする

## 新規エージェントを追加する場合

- `.claude/agents/<name>.md` に YAML frontmatter (`name` / `description` / `tools`) と本文 Markdown を書く
- `description` は呼び出し判断に使われるため、対象ドメイン・主要チェック項目・トリガー条件を挙げる。ただし常時ロードされるので **高シグナル語に絞って簡潔に** (構成方針の該当項目を参照)
- レビュー専門なら `tools: Read, Grep, Glob, Bash` に絞る (Edit/Write を渡さない)。**`Bash` は任意のシェルコマンドを実行できる強力な権限である点に注意**: レビュー用途では `git diff` / `git ls-files` / `grep` / `sed` 等の **読み取り系コマンドに限定して使う** こと。書き込み・削除・ネットワーク送信を伴う操作は本文中の例示・指示に含めないこと (エージェント本文がガードレールになる)
- 主要参照ファイルへのリンクは、各エージェント markdown からの相対パスで貼る (`../../packages/backend/...` のような形)。絶対パスは contributor のホームディレクトリ依存になるので使わない

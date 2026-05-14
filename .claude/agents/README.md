# `.claude/agents/` — プロジェクト固有のサブエージェント

Misskey の特定領域に特化したレビュー / 調査エージェントを `.claude/agents/<name>.md` 形式で配置する。

frontmatter (`name` + `description` + `tools`) は、Claude が **自動でエージェントを呼び出すか判断する** 唯一の手がかりになる。`description` には用途を具体的かつ網羅的に書くこと (動詞 + 対象 + トリガー条件)。

## 実装済サブエージェント

| エージェント名 | 役割 | 優先度 |
|---|---|---|
| [misskey-api-reviewer](misskey-api-reviewer.md) | NestJS DI + meta/paramDef + UUID 重複 + endpoint-list.ts 登録 + ApiError throw + misskey-js 再生成 + e2e + CHANGELOG をチェック | 高 (登録漏れで 404 / autogen CI 落ち頻発) |
| [vue-component-reviewer](vue-component-reviewer.md) | Mk\* 命名 / `<script lang="ts" setup>` / type-only defineProps / SCSS module / CSS 変数 / i18n.ts と i18n.tsx の使い分け / os.\* 経由 / a11y / `*.stories.impl.ts` 併設をチェック | 中 (CI 直撃は SPDX / locales 編集違反のみ。他は実害が出てから検出されるケースが多く API ほどの即死性はない) |

設計方針: `tools` を編集権限なし (Edit/Write を渡さない) に絞り、PR baseline (`git merge-base origin/develop HEAD`) との差分から自動的にレビュー対象を抽出する。

## 新規エージェントを追加する場合

- `.claude/agents/<name>.md` に YAML frontmatter (`name` / `description` / `tools`) と本文 Markdown を書く。
- `description` は呼び出し判断に使われるため、対象ドメイン・主要チェック項目・トリガー条件を **具体的に** 列挙する。
- レビュー専門なら `tools: Read, Grep, Glob, Bash` に絞る (Edit/Write を渡さない)。**`Bash` は任意のシェルコマンドを実行できる強力な権限である点に注意**: レビュー用途では `git diff` / `git ls-files` / `grep` / `sed` 等の **読み取り系コマンドに限定して使う** こと。書き込み・削除・ネットワーク送信を伴う操作は本文中の例示・指示に含めないこと (エージェント本文がガードレールになる)。
- 主要参照ファイルへのリンクは、リポジトリルートからの相対パス (例: `../../packages/backend/...`) で貼る。絶対パスは contributor のホームディレクトリ依存になるので使わない。
- 差分抽出は `git merge-base origin/develop HEAD` を baseline にする (PR / ブランチ全体を見るため)。`git diff HEAD` 単体は **未コミット差分しか取れず、コミット済の PR では空になって誤判定する** ので使わない。
- 完成したらこの README の表にも 1 行追加する。

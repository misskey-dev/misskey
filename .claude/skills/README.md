# `.claude/skills/` — プロジェクト固有のカスタムスキル

Misskey 固有の繰り返しタスクを Claude にスムーズに実行させるための **カスタムスキル** を `.claude/skills/<name>/SKILL.md` 形式で配置する。

frontmatter (`name` + `description`) は、Claude が **自動でスキルを呼び出すか判断する** 唯一の手がかりになる。`description` には用途を具体的かつ網羅的に書き、pushy なトリガー語 (例: "Use whenever ...", "Must be consulted before any ...") で発見されやすくする。

実装済スキルの一覧は本ファイルでは管理しない (腐敗するため)。各サブディレクトリの `SKILL.md` の frontmatter が自己説明として機能する。

## 構成方針

Anthropic 公式の [Agent Skills ベストプラクティス](https://platform.claude.com/docs/ja/agents-and-tools/agent-skills/best-practices) に従い、以下の構造を採用する:

- **SKILL.md 本体は 500 行以下** (理想は 30-80 行の索引)
- 詳細は `references/tasks/` (手順) と `references/knowledge/` (規約・背景知識) に分離 (progressive disclosure)
- リンクは **1 レベル深いリンクのみ** (SKILL.md → references の 1 段)
- ファイルシステム上の references は読まれるまでゼロコンテキストコスト

ECC (everything-claude-code) 由来の MIT スキルが含まれる場合は、ファイル冒頭の SPDX ヘッダー + [.claude/THIRD_PARTY_LICENSES.md](../THIRD_PARTY_LICENSES.md) §1 に出典を記載する。

## 新規スキルを追加する場合

- `.claude/skills/<name>/SKILL.md` に YAML frontmatter (`name` + `description`) と本文 Markdown を書く
- description は **三人称の "Use when ..." 形式** で、主要キーワード網羅。pushy なトリガー語 ("Must be consulted before ...") を入れる
- `disable-model-invocation: true` は付けない (auto-invoke させたいため)
- 主要参照ファイルへのリンクは、各 markdown ファイルからの相対パスで貼る (`../../../../packages/backend/...` のような形)。絶対パスは contributor のホームディレクトリ依存になるので使わない
- 詳細を分ける場合は `references/tasks/` (手順) / `references/knowledge/` (知識) の二分に従う
- スキル作成は `/skill-creator` (公式の skill-creator スキル) のガイドを経由するのが推奨

## 関連

- 各スキルの description で自動索引される設計のため、実装済スキルの手書き索引 (一覧表) は本ファイルにも `AGENTS.md` にも持たない方針 (手書き索引は腐敗するため、frontmatter の description を唯一の索引とする)
- スキルそのものの健全性検査は [/harness-audit](../commands/harness-audit.md) で採点できる

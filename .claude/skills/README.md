# `.claude/skills/` — プロジェクト固有のカスタムスキル

Misskey 固有の繰り返しタスクを Claude にスムーズに実行させるための **カスタムスキル** を `.claude/skills/<name>/SKILL.md` 形式で配置する。

frontmatter (`name` + `description`) は、Claude が **自動でスキルを呼び出すか判断する** 唯一の手がかりになる。`description` には用途を具体的かつ網羅的に書く (動詞 + 対象 + トリガー条件)。

## 実装済スキル

### Misskey 固有 (本リポジトリ向け書き起こし)

| スキル名 | 役割 | 優先度 |
| --- | --- | --- |
| [create-migration](create-migration/SKILL.md) | TypeORM CLI (`migration:generate` / `migration:create`) でマイグレーションを生成し、SPDX / up-down / `check-migrations` まで誘導 | 高 (342 既存 / 規約厳しい) |
| [add-api-endpoint](add-api-endpoint/SKILL.md) | NestJS DI + meta/paramDef 規約で API エンドポイント追加。`endpoint-list.ts` 登録と `misskey-js` 再生成を含む | 高 |
| [add-i18n-key](add-i18n-key/SKILL.md) | `locales/ja-JP.yml` のみ編集する補助。型は `packages/i18n` が自動再生成 | 中 |
| [add-mk-component](add-mk-component/SKILL.md) | `Mk*` 命名 + SPDX (HTML) + SCSS module + `*.stories.impl.ts` 併設の Vue コンポーネントを一括スキャフォールド | 中 |

### ECC (everything-claude-code) 由来 — MIT セレクトインポート

[.claude/THIRD_PARTY_LICENSES.md](../THIRD_PARTY_LICENSES.md) §1 に出典・改変メモ・MIT 全文を集約。

| スキル名 | 役割 | 優先度 |
| --- | --- | --- |
| [context-budget](context-budget/SKILL.md) | agents / skills / MCP / CLAUDE.md の token overhead を見える化し、肥大コンポーネントを検出 | 中 |

設計方針: `create-migration` は手動の `Date.now()` 命名ではなく TypeORM 公式 CLI (`migration:generate` / `migration:create`) を採用。Storybook ファイル名は `*.stories.impl.ts` 規約に準拠する。

## 新規スキルを追加する場合

- `.claude/skills/<name>/SKILL.md` に YAML frontmatter (`name` + `description`) と本文 Markdown を書く。
- `disable-model-invocation: true` は付けない (auto-invoke させたいため)。
- 主要参照ファイルへのリンクは、リポジトリルートからの相対パス (例: `../../packages/backend/...`) で貼る。絶対パスは contributor のホームディレクトリ依存になるので使わない。
- 完成したらこの README の表にも 1 行追加する。

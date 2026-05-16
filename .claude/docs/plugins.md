# 有効化済 Claude Code プラグイン

`.claude/settings.json` で 14 プラグインが有効化されている。それぞれの典型的な利用シーンを 1 行で示す。

| プラグイン | 用途 |
| --- | --- |
| `frontend-design` | UI コンポーネント / ページの設計・デザイン作業 (Vue 3 編集に有効) |
| `superpowers` | TDD・debugging・brainstorming・planning 等のメタスキル群 |
| `context7` | OSS ドキュメントの取得 (Vue 3, NestJS, TypeORM, Vitest 等) — 訓練データの古さを補う |
| `code-review` | コードレビュー (`/code-review`) |
| `code-simplifier` | コード整理 (`code-simplifier:code-simplifier` サブエージェント経由) |
| `github` | GitHub PR / Issue 操作 (gh ベースだが補助コマンドあり) |
| `skill-creator` | 新スキルの作成・改善・評価 |
| `feature-dev` | 機能開発ガイド (`/feature-dev:feature-dev` / 内部に `code-architect` / `code-explorer` / `code-reviewer` サブエージェント) |
| `claude-md-management` | CLAUDE.md の作成・改善 (`/claude-md-management:revise-claude-md` / `claude-md-improver` エージェント) |
| `typescript-lsp` | TypeScript LSP 連携 (型情報を活用) |
| `security-guidance` | セキュリティレビュー (`/security-review`) |
| `pr-review-toolkit` | PR レビュー一式。サブエージェント: `code-reviewer` / `code-simplifier` / `comment-analyzer` / `pr-test-analyzer` / `silent-failure-hunter` / `type-design-analyzer` |
| `claude-code-setup` | Claude Code 自動化セットアップ提案 |
| `playwright` | ブラウザ自動操作 (フロントエンド動作確認時に有用) |

## 使い分けの指針

- **API 関連の調査**: `context7` で対象ライブラリのドキュメントを取得 → 編集。
- **PR 作成前**: `pr-review-toolkit` の各エージェント (code-reviewer / silent-failure-hunter 等) を並列で走らせる。
- **新機能の設計**: `feature-dev` → brainstorming → 実装の流れ。
- **UI 確認**: `playwright` で `pnpm dev` の画面を直接操作。
- **将来追加検討**: PostgreSQL MCP — TypeORM + 342 migration の調査効率化。read-only ロールで登録し、接続先 (`misskey` DB) と権限分離に注意する。

<!--
Sync Impact Report
==================
Version change: 1.0.0 (initial)
Modified principles: N/A (new constitution)
Added sections:
  - Core Principles (5 principles)
  - 技術制約
  - 開発ワークフロー
  - Governance
Removed sections: N/A
Templates requiring updates:
  - .specify/templates/plan-template.md: Constitution Check section exists - compatible
  - .specify/templates/spec-template.md: Requirements section - compatible
  - .specify/templates/tasks-template.md: Test tasks optional - compatible
Follow-up TODOs: None
-->

# Misskey noc.ski Constitution

## Core Principles

### I. ビルドチェック必須 (Build Verification - NON-NEGOTIABLE)

全てのコード変更後、typecheckとbuildを必ず実行しなければならない。

- 変更後は `pnpm run typecheck` および `pnpm run build` を実行すること
- エラー発生時は修正完了まで作業を停止すること
- ビルドチェックのスキップ、無効化、迂回は絶対禁止
- ロケールファイル編集後は `cd locales && node generateDTS.js` を実行すること

**理由**: Docker Build失敗を事前に防止し、デプロイ時の問題を未然に防ぐため。

### II. コミット許可制 (Commit Authorization)

ユーザーの明示的な許可なしにgit commitを実行してはならない。

- 「コミットしてください」と明確に指示された場合のみコミット実行
- Conventional Commits形式を使用: feat/fix/docs/style/refactor/test/chore
- git pushは完全禁止（ローカル操作のみ許可）

**理由**: 意図しない変更のコミットを防止し、ユーザーがコード変更の最終承認権を持つため。

### III. ファイル管理規約 (File Management Convention)

Claude作業ファイルは `claude/` ディレクトリに配置し、既存ファイル編集を優先すること。

- Claude作成スクリプト: `claude/scripts/`
- Claude作成テスト: `claude/tests/`
- Claude作成ドキュメント: `claude/docs/`
- Claude作成一時ファイル: `claude/tmp/`
- 新規ファイル作成は最小限に抑え、既存ファイル編集を優先すること

**理由**: プロジェクトファイルとClaude作業を明確に分離し、コードベースの整理を維持するため。

### IV. 禁止事項厳守 (Prohibited Operations - NON-NEGOTIABLE)

以下の操作は絶対に実行してはならない。

- デプロイ関連コマンド（`./scripts/deploy.sh`、`docker compose`等）
- Dockerネットワークの作成・削除・変更
- コンテナの停止・削除・再作成
- SQLiteのDBファイル（*.db）の初期化・削除
- `rm -rf` コマンド（ユーザー確認なし）

**理由**: デプロイはユーザーが実行するため、本番環境の安全性を確保するため。

### V. 品質管理・ドキュメント化 (Quality & Documentation)

新機能実装時は必ずドキュメント化し、実在しない機能の提案を禁止する。

- 新機能は必ず `docs/` または `claude/docs/` にドキュメント化すること
- 実在しない機能や仕組みを勝手に提案・記載してはならない
- 大げさな表現（「魔法の」「瞬殺」等）は使用しない
- 疑問がある場合は作業を中断して質問すること

**理由**: 正確な情報提供と、プロジェクトの長期的な保守性を確保するため。

## 技術制約

### 環境要件

- **ランタイム**: Node.js 22.12+（nvm使用でバージョン管理）
- **データベース**: PostgreSQL 17
- **インフラ**: Docker マルチインスタンス（16GB RAM）
- **フレームワーク**: Misskey（TypeScript/Vue.js）

### エンティティ追加手順

1. エンティティファイル作成
2. `packages/backend/src/models/_.ts` にインポート・エクスポート追加
3. RepositoryModule登録
4. マイグレーション作成

### データベースアクセス

- ホスト: localhost（Docker外）/ host.docker.internal（Docker内）
- ポート: 5432
- 接続情報: `.config/default.yml` 参照

## 開発ワークフロー

### コード変更フロー

1. 変更を実装
2. `pnpm run typecheck` 実行
3. `pnpm run build` 実行（またはフロントエンド/バックエンド個別ビルド）
4. エラーがあれば修正し、ステップ2に戻る
5. ユーザーに完了報告
6. ユーザーの指示があればコミット

### ロケール変更フロー

1. `locales/ja-JP.yml` 等を編集
2. `cd locales && node generateDTS.js` 実行
3. 通常のビルドチェックを実行

### 品質チェック項目

- お絵かきチャット座標精度: 許容誤差 ±5px以内
- Transform状態: transformedSize = displaySize × zoomLevel
- 正規化座標: 範囲 0.0〜1.0
- デバイス互換性: PC/スマホ/タブレット

## Governance

### 憲法の優先度

本Constitutionは他の全てのプラクティスに優先する。Constitution違反のPR/コード変更は許可されない。

### 改訂手続き

1. 改訂提案をドキュメント化
2. ユーザーの承認を取得
3. 関連テンプレートへの影響を評価
4. バージョンを更新し、変更履歴を記録

### バージョニングポリシー

- **MAJOR**: 原則の削除または後方互換性のない変更
- **MINOR**: 新原則の追加または既存原則の実質的拡張
- **PATCH**: 明確化、文言修正、タイポ修正

### コンプライアンスレビュー

- 全てのコード変更はConstitution原則との整合性を確認すること
- 複雑さは正当化が必要
- ランタイム開発ガイダンスは `CLAUDE.md` を参照

**Version**: 1.0.0 | **Ratified**: 2025-12-09 | **Last Amended**: 2025-12-09

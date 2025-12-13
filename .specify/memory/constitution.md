<!--
Sync Impact Report
==================
Version change: 1.1.0 → 1.1.1
Modified principles: None
Added sections:
  - 開発ワークフロー: タスク管理フロー（tasks.md更新ルール）
Removed sections: None
Templates requiring updates:
  - .specify/templates/plan-template.md: ✅ Compatible (no changes required)
  - .specify/templates/spec-template.md: ✅ Compatible (no changes required)
  - .specify/templates/tasks-template.md: ✅ Compatible (task update workflow clarified)
  - .specify/templates/commands/*.md: ✅ Compatible (no outdated references)
Follow-up TODOs:
  - Consider creating .claude/skills/ examples for common investigation patterns
  - Document spec.md size threshold guidelines (e.g., >500 lines → consider splitting)
  - Document tasks.md update triggers (e.g., after completing each user story, blocking issue discovered)
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

### VI. 仕様管理規約 (Specification Management)

spec.mdの肥大化を防ぎ、保守性を高めるため外部ファイルとスキル化を活用すること。

- spec.mdが大きくなる場合、詳細は外部ファイルに分割してインデックス参照すること
  - 例: `docs/architecture.md`、`docs/api-design.md`、チェックリストファイル等
  - spec.mdには概要とファイルリンクのみを記載
- 共通して利用できる機能はスキル化し `.claude/skills/` に登録すること
  - 例: データベース調査、特定システムのデバッグ、定型タスク等
- 調査結果やファイルインデックスも `.claude/skills/` に登録し再利用可能にすること
  - 例: コードベース構造調査結果、依存関係マップ等

**理由**: spec.mdの可読性維持、仕様の再利用性向上、調査コストの削減のため。

### VII. 継続性保証 (Continuity Guarantee)

作業は途中で中断せず、完了まで継続し続けること。

- タスク開始後は完了するまで中断しないこと
- 分割が必要な大規模タスクは事前に分割計画を立てること
- 予期せぬ問題発生時は状況を報告し、対応方針を確認してから継続すること

**理由**: 作業の中断による品質低下や進捗損失を防ぎ、効率的な開発を実現するため。

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

### タスク管理フロー

tasks.mdは作業進捗の正確な記録であり、適宜（随時）更新すること。

- **更新タイミング**: 以下のいずれかが発生した際に即座に更新
  - タスク完了時（チェックボックスを✓に変更）
  - 新しいサブタスクや依存タスクを発見した時（タスクリストに追加）
  - タスクの優先度や依存関係が変更された時
  - ブロッキング問題が発生してタスクを延期する時
- **更新内容**: タスクのステータス、新規タスク追加、優先度変更、ブロッカー記録
- **記録の精度**: 作業の実態を正確に反映し、次回作業時の迅速な再開を可能にすること

**理由**: タスクの進捗状況を常に最新に保つことで、作業の透明性と再現性を確保するため。

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

**Version**: 1.1.1 | **Ratified**: 2025-12-09 | **Last Amended**: 2025-12-14

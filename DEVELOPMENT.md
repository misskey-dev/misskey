# yamisskey 開発ガイド

![yamisskeyプロジェクトアイコン](https://github.com/yamisskey-dev/yamisskey-assets/blob/main/yamisskey/yamisskey_project.png?raw=true)

## 概要

このドキュメントは、yamisskey 開発チームメンバー向けの技術手順書です。

> [!NOTE]
> 開発への参加を希望される方は、まずプロジェクト管理者にご連絡ください。

[Misskey](https://github.com/misskey-dev/misskey) フォーク「[yamisskey](https://github.com/yamisskey-dev/yamisskey/)」の開発手順を説明します。基本的な開発手順は[フォーク元の開発ガイド](https://github.com/misskey-dev/misskey/blob/develop/CONTRIBUTING.md#development)を参照してください。

## ブランチとバージョン

yamisskey は 3ブランチで開発を進めます：

| ブランチ | 環境 | 用途 |
|---------|------|---------------|------|
| **develop** | 開発（ローカル）| 新機能開発・実験的機能 |
| **staging** | テスト（[なやみすきー](https://na.yami.ski/)） | 本番前検証（push時にDockerイメージ自動ビルド） |
| **master** | 本番（[やみすきー](https://yami.ski/) | 安定運用版（リリース時にDockerイメージ自動ビルド） |

**開発の流れ**: develop → staging → master

**重要**: すべての変更は**必ずdevelopブランチから開始**してください。stagingやmasterで直接開発することは禁止です。

## 開発環境

### 必要な環境
- Node.js（LTS版推奨）
- pnpm
- Git 2.5+
- Docker & Docker Compose（Dev Container用、推奨）

### 推奨エディタ
- VSCode 1.103+（Dev Container対応）
- その他のエディタも使用可能

## セットアップ

### 1. リポジトリのクローン

```bash
git clone https://github.com/yamisskey-dev/yamisskey.git
cd yamisskey

# リモート設定
git remote add upstream https://github.com/misskey-dev/misskey.git
git fetch --all --prune --tags
```

### 2. 開発ブランチに切り替え

```bash
git checkout develop
```

### 3. 依存関係のインストール

```bash
pnpm install
pnpm build
pnpm build-misskey-js-with-types
```

## 開発フロー

### 日常的な開発作業

**重要**: 開発は必ずdevelopブランチで行います。

```bash
# developブランチに切り替え
git checkout develop

# トピックブランチで開発
git checkout -b feat/新機能名

# 開発・テスト
pnpm dev

# コミット
git add .
git commit -m "feat: 新機能の実装"

# developにマージしてプッシュ
git checkout develop
git merge feat/新機能名
git push origin develop
```

### テスト環境への反映

```bash
# stagingブランチに切り替え
git checkout staging
git pull origin staging
git merge develop

# バージョン番号をインクリメント
# 形式: {misskey-version}-yami-{yamisskey-version}
# 例: 2025.11.1-yami-1.9.30 → 2025.11.1-yami-1.9.31

git push origin staging  # Dockerイメージが自動ビルドされる
```

[なやみすきー](https://na.yami.ski/)で動作確認後、本番への反映を進めます。

### 本番環境への反映

```bash
# masterブランチに切り替え
git checkout master
git pull origin master
git merge staging

# バージョンはstagingと同じ
# 形式: {misskey-version}-yami-{yamisskey-version}

git push origin master
```

**リリース手順**:
1. `DIFFERENCE.md` の Unreleased 項目に変更点を記載
2. `package.json` の version を yami 形式でインクリメント（例: `2025.11.1-yami-1.9.31`）
3. GitHub で [Release Manager Dispatch](https://github.com/yamisskey-dev/yamisskey/actions/workflows/release-with-dispatch.yml) を実行
4. 自動生成された PR を確認してマージ
5. マージすると GitHub Release と Docker イメージが自動生成

## 応用的な使い方

### git worktreeを使った並列開発

複数の機能を同時開発する場合、git worktreeを使用できます：

```bash
# メインリポジトリで作業
cd yamisskey

# 並列開発用のworktreeを作成（developベース）
git worktree add ../yamisskey-feat-a -b feat/feature-a develop
git worktree add ../yamisskey-feat-b -b feat/feature-b develop

# 各worktreeで開発
cd ../yamisskey-feat-a
pnpm install && pnpm build
# 開発作業...

cd ../yamisskey-feat-b
pnpm install && pnpm build
# 開発作業...

# 開発完了後、developにマージ
cd ../yamisskey
git checkout develop
git merge feat/feature-a
git merge feat/feature-b
git push origin develop

# worktreeの削除
git worktree remove ../yamisskey-feat-a
git worktree remove ../yamisskey-feat-b
```

### アップストリームからの変更取り込み

```bash
# バックアップを作成
git checkout develop
VERSION=$(node -p "require('./package.json').version")
git branch backup/$VERSION

git checkout staging
VERSION=$(node -p "require('./package.json').version")
git branch backup/$VERSION

git checkout master
VERSION=$(node -p "require('./package.json').version")
git branch backup/$VERSION

# developに取り込み
git checkout develop
git fetch upstream --tags --prune
git merge --no-ff --no-edit -S <tag-name>

# コンフリクト解決後
git add -A
git commit -m "upstream: resolve conflicts for <tag-name>"

# staging → master へ順次反映
```

### 他フォークからのcherry-pick

```bash
# 他フォークをリモートに追加
git remote add cherrypick https://github.com/kokonect-link/cherrypick.git
git fetch cherrypick

# コミットIDを確認
git log cherrypick/develop --oneline -20

# developにcherry-pick
git checkout develop
git cherry-pick <コミットID>
```

## トラブルシューティング

```bash
# ブランチの状態を確認
git status
git log --oneline -10

# マージの中断
git merge --abort

# バックアップからの復元
git checkout develop
git reset --hard backup/2025.11.1-yami-1.9.30
git push --force origin develop  # 注意：慎重に実行

# worktreeのクリーンアップ
git worktree prune

# 権限エラー
sudo chown -R $(whoami) yamisskey/
```

## 開発ルール

- **すべての開発はdevelopから開始**（staging/masterでの直接開発は禁止）
- トピックブランチで開発し、developにマージ
- develop → staging → master の順で反映（逆順禁止）
- 重要な変更前は必ずバックアップを作成
- プライバシー・セキュリティ機能は特に慎重にテスト

## CI/CDとAI活用

### GitHub Actions
- コード品質保証（リント、型チェック）
- 自動テスト実行とビルドエラー検出
- 本番環境への安全なデプロイ

### AI活用
- Dev Containerに各種AIツールを統合可能
- PR レビュー: Claude と Gemini による自動コードレビュー
- 生成コードは必ず人間がレビュー
- セキュリティ・プライバシー関連は適切性を必ず確認

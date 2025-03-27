# 開発環境セットアップガイド
[CONTRIBUTING.md](./CONTRIBUTING.md) を読むとすべてが書いてありますが、ここでは簡単に日本語で解説する。  
このガイドでは、Misskeyの開発環境を構築する2つの方法について説明します。

## 1. DevContainer を使用する方法 (推奨)

DevContainerを使用すると、VSCode上で一貫した開発環境を簡単に構築できます。
セットアップに少し時間がかかる

### 必要条件
- Visual Studio Code
- Docker Desktop
- "Dev Containers" VSCode拡張機能

### セットアップ手順
1. VSCodeでプロジェクトを開く
2. 左下の緑色のアイコンをクリックし、"Reopen Container"を選択
3. DevContainerのビルドが完了するまで待機

DevContainerには以下の機能が含まれています：
- Node.js 22.11.0
- 必要なVSCode拡張機能の自動インストール
- 開発用ポート(3000)の自動転送
- 初期設定の自動実行

## 2. ホストで直接開発する方法

ホストマシン上で直接開発を行う場合は、以下の手順に従ってください。

### 必要条件
- Node.js 20.0.0以上
- pnpm
- Docker と Docker Compose

### 初期セットアップ
```sh
# 設定ファイルの準備
cp compose.local_db.yml compose.yml    # データベース設定
cp dev_default.yml default.yml         # アプリケーション設定
cp dev_docker.env docker.env           # 環境変数

# データベースの起動
docker compose up -d

# 依存関係のインストールとビルド
pnpm i                                 # パッケージのインストール
pnpm build                            # プロジェクトのビルド
pnpm migrate                          # データベースのマイグレーション
```

### 開発サーバーの起動
```sh
pnpm dev
```

開発サーバーが起動すると、 http://localhost:3000 でアクセスできます。

### 注意事項
- データベースの初期化が完了するまで少し時間がかかる場合があります
- 環境変数やアプリケーション設定の変更後は、サーバーの再起動が必要です

Misskey構築の手引き
================================================================

Misskeyサーバーの構築にご関心をお寄せいただきありがとうございます！
このガイドではMisskeyのインストール・セットアップ方法について解説します。

[英語版もあります - English version also available](./setup.en.md)

----------------------------------------------------------------

*1.* Misskeyユーザーの作成
----------------------------------------------------------------
Misskeyはrootユーザーで実行しない方がよいため、代わりにユーザーを作成します。
Debianの例:

```
adduser --disabled-password --disabled-login misskey
```

*2.* 依存関係をインストールする
----------------------------------------------------------------
これらのソフトウェアをインストール・設定してください:

#### 依存関係 :package:
* **[Node.js](https://nodejs.org/en/)** (10.0.0以上)
* **[MongoDB](https://www.mongodb.com/)** (3.6以上)

##### オプション
* [Redis](https://redis.io/)
	* Redisはオプションですが、インストールすることを強く推奨します。
	* インストールしなくていいのは、あなたのインスタンスが自分専用のときだけとお考えください。
	* 具体的には、Redisをインストールしないと、次の事が出来なくなります:
		* Misskeyプロセスを複数起動しての負荷分散
		* レートリミット
		* ジョブキュー
		* Twitter連携
* [Elasticsearch](https://www.elastic.co/)
	* 検索機能を有効にするためにはインストールが必要です。
* [FFmpeg](https://www.ffmpeg.org/)

*3.* MongoDBの設定
----------------------------------------------------------------
ルートで:
1. `mongo` mongoシェルを起動
2. `use misskey` misskeyデータベースを使用
3. `db.createUser( { user: "misskey", pwd: "<password>", roles: [ { role: "readWrite", db: "misskey" } ] } )` misskeyユーザーを作成
4. `exit` mongoシェルを終了

*4.* Misskeyのインストール
----------------------------------------------------------------
1. `su - misskey` misskeyユーザーを使用
2. `git clone -b master git://github.com/syuilo/misskey.git` masterブランチからMisskeyレポジトリをクローン
3. `cd misskey` misskeyディレクトリに移動
4. `git checkout $(git tag -l | grep -v 'rc[0-9]*$' | sort -V | tail -n 1)` [最新のリリース](https://github.com/syuilo/misskey/releases/latest)を確認
5. `npm install` Misskeyの依存パッケージをインストール

*5.* 設定ファイルを作成する
----------------------------------------------------------------
1. `cp .config/example.yml .config/default.yml` `.config/example.yml`をコピーし名前を`default.yml`にする。
2. `default.yml` を編集する。

*6.* Misskeyのビルド
----------------------------------------------------------------

ビルドする前に、`NODE_ENV`を`production`にする必要があります。例:
* Linux: `export NODE_ENV=production`
* Windows (PowerShell): `$env:NODE_ENV="production"`
* Windows (CMD): `set NODE_ENV=production`

次のコマンドでMisskeyをビルドしてください:

`npm run build`

Debianをお使いであれば、`build-essential`パッケージをインストールする必要があります。

何らかのモジュールでエラーが発生する場合はnode-gypを使ってください:
1. `npm install -g node-gyp`
2. `node-gyp configure`
3. `node-gyp build`
4. `npm run build`

*7.* 以上です！
----------------------------------------------------------------
お疲れ様でした。これでMisskeyを動かす準備は整いました。

### 通常起動
`npm start`するだけです。GLHF!

### systemdを用いた起動
1. systemdサービスのファイルを作成: `/etc/systemd/system/misskey.service`
2. エディタで開き、以下のコードを貼り付けて保存:

```
[Unit]
Description=Misskey daemon

[Service]
Type=simple
User=misskey
ExecStart=/usr/bin/npm start
WorkingDirectory=/home/misskey/misskey
TimeoutSec=60
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=misskey
Restart=always

[Install]
WantedBy=multi-user.target
```
CentOSで1024以下のポートを使用してMisskeyを使用する場合は`ExecStart=/usr/bin/sudo /usr/bin/npm start`に変更する必要があります。

3. `systemctl daemon-reload ; systemctl enable misskey` systemdを再読み込みしmisskeyサービスを有効化
4. `systemctl start misskey` misskeyサービスの起動

`systemctl status misskey`と入力すると、サービスの状態を調べることができます。

### Misskeyを最新バージョンにアップデートする方法:
1. `git fetch`
2. `git checkout $(git tag -l | grep -v 'rc[0-9]*$' | sort -V | tail -n 1)`
3. `npm install`
4. `npm run build`
5. [ChangeLog](../CHANGELOG.md)でマイグレーション情報を確認する

なにか問題が発生した場合は、`npm run clean`すると直る場合があります。

----------------------------------------------------------------

なにかお困りのことがありましたらお気軽にご連絡ください。

Misskey構築の手引き
================================================================

Misskeyサーバーの構築にご関心をお寄せいただきありがとうございます！
このガイドではMisskeyのインストール・セットアップ方法について解説します。

- [英語版もあります - English version also available](./setup.en.md)
- [简体中文版同样可用 - Simplified Chinese version also available](./setup.zh.md)

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
* **[Node.js](https://nodejs.org/en/)** (12.x, 14.x)
* **[PostgreSQL](https://www.postgresql.org/)** (10以上)
* **[Redis](https://redis.io/)**

##### オプション
* [Yarn](https://yarnpkg.com/)
	* セキュリティの観点から推奨されます。 yarn をインストールしない方針の場合は、文章中の `yarn` を適宜 `npx yarn` と読み替えてください。
* [Elasticsearch](https://www.elastic.co/)
	* 検索機能を有効にするためにはインストールが必要です。
* [FFmpeg](https://www.ffmpeg.org/)

*3.* Misskeyのインストール
----------------------------------------------------------------
1. misskeyユーザーを使用

	`su - misskey`

2. masterブランチからMisskeyレポジトリをクローン

	`git clone -b master git://github.com/misskey-dev/misskey.git`

3. misskeyディレクトリに移動

	`cd misskey`

4. [最新のリリース](https://github.com/misskey-dev/misskey/releases/latest)を確認

	`git checkout master`

5. Misskeyの依存パッケージをインストール

	`yarn install`

*4.* 設定ファイルを作成する
----------------------------------------------------------------
1. `.config/example.yml`をコピーし名前を`default.yml`にする。

	`cp .config/example.yml .config/default.yml`

2. `default.yml` を編集する。

*5.* Misskeyのビルド
----------------------------------------------------------------

次のコマンドでMisskeyをビルドしてください:

`NODE_ENV=production yarn build`

Debianをお使いであれば、`build-essential`パッケージをインストールする必要があります。

何らかのモジュールでエラーが発生する場合はnode-gypを使ってください:
1. `npx node-gyp configure`
2. `npx node-gyp build`
3. `NODE_ENV=production yarn build`

*6.* データベースを初期化
----------------------------------------------------------------
``` shell
yarn run init
```

*7.* 以上です！
----------------------------------------------------------------
お疲れ様でした。これでMisskeyを動かす準備は整いました。

### 通常起動
`NODE_ENV=production yarn start`するだけです。GLHF!

### systemdを用いた起動
1. systemdサービスのファイルを作成

	`/etc/systemd/system/misskey.service`

2. エディタで開き、以下のコードを貼り付けて保存:

	```
	[Unit]
	Description=Misskey daemon

	[Service]
	Type=simple
	User=misskey
	ExecStart=/usr/bin/npm start
	WorkingDirectory=/home/misskey/misskey
	Environment="NODE_ENV=production"
	TimeoutSec=60
	StandardOutput=syslog
	StandardError=syslog
	SyslogIdentifier=misskey
	Restart=always

	[Install]
	WantedBy=multi-user.target
	```

	CentOSで1024以下のポートを使用してMisskeyを使用する場合は`ExecStart=/usr/bin/sudo /usr/bin/npm start`に変更する必要があります。

3. systemdを再読み込みしmisskeyサービスを有効化

	`systemctl daemon-reload; systemctl enable misskey`

4. misskeyサービスの起動

	`systemctl start misskey`

`systemctl status misskey`と入力すると、サービスの状態を調べることができます。

### Misskeyを最新バージョンにアップデートする方法:
1. `git checkout master`
2. `git pull`
3. `yarn install`
4. `NODE_ENV=production yarn build`
5. `yarn migrate`

なにか問題が発生した場合は、`yarn clean`または`yarn cleanall`すると直る場合があります。

----------------------------------------------------------------

なにかお困りのことがありましたらお気軽にご連絡ください。

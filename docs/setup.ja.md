Misskey構築の手引き
================================================================

Misskeyサーバーの構築にご関心をお寄せいただきありがとうございます！
このガイドではMisskeyのインストール・セットアップ方法について解説します。

[英語版もあります - English version also available](./setup.en.md)

----------------------------------------------------------------

Dockerを利用してMisskeyを構築することもできます: [Setup with Docker](./docker.en.md)。
その場合、*3番目*以降の手順はスキップできます。

*1.* ドメインの用意
----------------------------------------------------------------
Misskeyはプライマリ ドメインとセカンダリ ドメインを必要とします。

* プライマリ ドメインはMisskeyの主要な部分を提供するために使われます。
* セカンダリ ドメインはXSSといった脆弱性の対策に使われます。

**セカンダリ ドメインがプライマリ ドメインのサブドメインであってはなりません。**

### サブドメイン
Misskeyは以下のサブドメインを使います:

* **api**.*{primary domain}*
* **auth**.*{primary domain}*
* **docs**.*{primary domain}*
* **ch**.*{primary domain}*
* **stats**.*{primary domain}*
* **status**.*{primary domain}*
* **dev**.*{primary domain}*
* **file**.*{secondary domain}*

*2.* reCAPTCHAトークンの用意
----------------------------------------------------------------
MisskeyはreCAPTCHAトークンを必要とします。
https://www.google.com/recaptcha/intro/ にアクセスしてトークンを生成してください。

*(オプション)* VAPIDキーペアの生成
----------------------------------------------------------------
ServiceWorkerを有効にする場合、VAPIDキーペアを生成する必要があります:

``` shell
npm install web-push -g
web-push generate-vapid-keys
```

*3.* 依存関係をインストールする
----------------------------------------------------------------
これらのソフトウェアをインストール・設定してください:

#### 依存関係 :package:
* *Node.js* と *npm*
* **[MongoDB](https://www.mongodb.com/)**
* **[Redis](https://redis.io/)**
* **[ImageMagick](http://www.imagemagick.org/script/index.php)**

##### オプション
* [Elasticsearch](https://www.elastic.co/) - 検索機能を向上させるために用います。

*4.* 設定ファイルを用意する
----------------------------------------------------------------
Misskeyをインストールしたディレクトリに、`.config`というディレクトリを作成し、
その中に`default.yml`という名前で設定ファイルを作ってください。
設定ファイルの下書きは[ここ](./config.md)にありますので、コピペしてご利用ください。

*5.* Misskeyのインストール
----------------------------------------------------------------

1. `git clone -b master git://github.com/syuilo/misskey.git`
2. `cd misskey`
3. `npm install`
4. `npm run build`

#### アップデートするには:
1. `git reset --hard && git pull origin master`
2. `npm install`
3. `npm run build`

*6.* 以上です！
----------------------------------------------------------------
お疲れ様でした。これでMisskeyを動かす準備は整いました。

### 起動
`sudo npm start`するだけです。GLHF!

### テスト
(ビルドされている状態で)`npm test`

### デバッグ :bug:
#### デバッグメッセージを表示するようにする
Misskeyは[debug](https://github.com/visionmedia/debug)モジュールを利用しており、ネームスペースは`misskey:*`となっています。

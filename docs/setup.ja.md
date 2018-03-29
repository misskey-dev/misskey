Misskey構築の手引き
================================================================

Misskeyサーバーの構築にご関心をお寄せいただきありがとうございます！
このガイドではMisskeyのインストール・セットアップ方法について解説します。

[英語版もあります - English version also available](./setup.en.md)

----------------------------------------------------------------

*1.* reCAPTCHAトークンの用意
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

*2.* 依存関係をインストールする
----------------------------------------------------------------
これらのソフトウェアをインストール・設定してください:

#### 依存関係 :package:
* *Node.js* と *npm*
* **[MongoDB](https://www.mongodb.com/)**
* **[Redis](https://redis.io/)**
* **[ImageMagick](http://www.imagemagick.org/script/index.php)**

##### オプション
* [Elasticsearch](https://www.elastic.co/) - 検索機能を向上させるために用います。

*3.* 設定ファイルを用意する
----------------------------------------------------------------
1. `.config`ディレクトリ内の`example.yml`をコピー
2. `default.yml`にリネーム
3. 編集する

*4.* Misskeyのインストール(とビルド)
----------------------------------------------------------------

1. `git clone -b master git://github.com/syuilo/misskey.git`
2. `cd misskey`
3. `npm install`
4. `npm run build`

#### アップデートするには:
1. `git reset --hard && git pull origin master`
2. `npm install`
3. `npm run build`

*5.* 以上です！
----------------------------------------------------------------
お疲れ様でした。これでMisskeyを動かす準備は整いました。

### 起動
`sudo npm start`するだけです。GLHF!

### テスト
(ビルドされている状態で)`npm test`

### デバッグ :bug:
#### デバッグメッセージを表示するようにする
Misskeyは[debug](https://github.com/visionmedia/debug)モジュールを利用しており、ネームスペースは`misskey:*`となっています。

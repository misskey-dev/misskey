Dockerを使ったMisskey構築方法
================================================================

このガイドはDockerを使ったMisskeyセットアップ方法について解説します。

[英語版もあります - English version also available](./docker.en.md)

----------------------------------------------------------------

*1.* Misskeyのダウンロード
----------------------------------------------------------------
1. masterブランチからMisskeyレポジトリをクローン

	`git clone -b master git://github.com/syuilo/misskey.git`

2. misskeyディレクトリに移動

	`cd misskey`

3. [最新のリリース](https://github.com/syuilo/misskey/releases/latest)を確認

	```bash
	git tag | grep '^10\.' | sort -V --reverse | \
	while read tag_name; do \
	if ! curl -s "https://api.github.com/repos/syuilo/misskey/releases/tags/$tag_name" \
	| grep -qE '"(draft|prerelease)": true'; \
	then git checkout $tag_name; break; fi ; done
	```

*2.* 設定ファイルを作成する
----------------------------------------------------------------
1. `cp .config/example.yml .config/default.yml` `.config/example.yml`をコピーし名前を`default.yml`にする
2. `cp .config/mongo_initdb_example.js .config/mongo_initdb.js` `.config/mongo_initdb_example.js`をコピーし名前を`mongo_initdb.js`にする
3. `default.yml`と`mongo_initdb.js`を編集する

*3.* Dockerの設定
----------------------------------------------------------------
`docker-compose.yml`を編集してください。

*4.* Misskeyのビルド
----------------------------------------------------------------
次のコマンドでMisskeyをビルドしてください:

`docker-compose build`

*5.* 以上です！
----------------------------------------------------------------
お疲れ様でした。これでMisskeyを動かす準備は整いました。

### 通常起動
`docker-compose up -d`するだけです。GLHF!

### Misskeyを最新バージョンにアップデートする方法:
1. `git fetch`
2. `git stash`
3. 

	```bash
	git tag | grep '^10\.' | sort -V --reverse | \
	while read tag_name; do \
	if ! curl -s "https://api.github.com/repos/syuilo/misskey/releases/tags/$tag_name" \
	| grep -qE '"(draft|prerelease)": true'; \
	then git checkout $tag_name; break; fi ; done
	```
4. `git stash pop`
5. `docker-compose build`
6. [ChangeLog](../CHANGELOG.md)でマイグレーション情報を確認する
7. `docker-compose stop && docker-compose up -d`

### cliコマンドを実行する方法:

`docker-compose run --rm web node cli/mark-admin @example`

----------------------------------------------------------------

なにかお困りのことがありましたらお気軽にご連絡ください。

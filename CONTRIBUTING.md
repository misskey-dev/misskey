# Contribution guide
**[✨ English version available](/docs/CONTRIBUTING.en.md)**

プロジェクトに興味を持っていただきありがとうございます！ このドキュメントでは、プロジェクトに貢献する際に必要な情報をまとめています。

## Issues
Issueを作成する前に、以下をご確認ください:
- 重複を防ぐため、既に同様の内容のIssueが作成されていないか検索してから新しいIssueを作ってください。
- Issueを質問に使わないでください。
	- Issueは、要望、提案、問題の報告にのみ使用してください。
	- 質問は、[Misskey Forum](https://forum.misskey.io/)や[Discord](https://discord.gg/Wp8gVStHW3)でお願いします。

## 実装をする前に
機能追加やバグ修正をしたいときは、まずIssueで設計、方針をレビューしてもらいましょう(無い場合は作ってください)。このステップがないと、せっかく実装してもPRがマージされない可能性が高くなります。

また、実装に取り掛かるときは当該Issueに自分をアサインしてください(自分でできない場合は他メンバーに自分をアサインしてもらうようお願いしてください)。
自分が実装するという意思表示をすることで、作業がバッティングするのを防ぎます。

## PRの作成
PRありがとうございます！ PRを作成する前に、以下をご確認ください:
- 可能であればタイトルに、以下で示すようなPRの種類が分かるキーワードをプリフィクスしてください。
  - `fix` / `refactor` / `feat` / `enhance` / `perf` / `chore` など
  - また、PRの粒度が適切であることを確認してください。ひとつのPRに複数の種類の変更や関心を含めることは避けてください。
- このPRによって解決されるIssueがある場合は、そのIssueへの参照を本文内に含めてください。
- [`CHANGELOG.md`](/CHANGELOG.md)に変更点を追記してください。リファクタリングなど、利用者に影響を与えない変更についてはこの限りではありません。
- この変更により新たに作成、もしくは更新すべきドキュメントがないか確認してください。
- 機能追加やバグ修正をした場合は、可能であればテストケースを追加してください。
- テスト、Lintが通っていることを予め確認してください。
  - `npm run test`、`npm run lint`でぞれぞれ実施可能です。[詳細](#testing)
- UIに変更がある場合はスクリーンショットを本文内に添付してください。

ご協力ありがとうございます🤗

## ブランチ
- **`master`** branch is tracking the latest release and used for production purposes.
- **`develop`** branch is where we work for the next release.
	- PRを作成するときは、基本的にこのブランチに向けてください。
- **`l10n_develop`** branch is reserved for localization management.

## Localization (l10n)
Misskey uses [Crowdin](https://crowdin.com/project/misskey) for localization management.
You can improve our translations with your Crowdin account.
Your changes in Crowdin are automatically submitted as a PR (with the title "New Crowdin translations") to the repository.
The owner [@syuilo](https://github.com/syuilo) merges the PR into the develop branch before the next release.

If your language is not listed in Crowdin, please open an issue.

![Crowdin](https://d322cqt584bo4o.cloudfront.net/misskey/localized.svg)

## Documentation
* Documents for instance admins are located in [`/docs`](/docs).
* Documents for end users are located in [`/src/docs`](/src/docs).

## Testing
- Test codes are located in [`/test`](/test).

### Run test
```
npm run test
```

#### Run specify test
```
npx cross-env TS_NODE_FILES=true TS_NODE_TRANSPILE_ONLY=true TS_NODE_PROJECT="./test/tsconfig.json" npx mocha test/foo.ts --require ts-node/register
```

### e2e tests
TODO

## Continuous integration
Misskey uses GitHub Actions for executing automated tests.
Configuration files are located in [`/.github/workflows`](/.github/workflows).

## Adding MisskeyRoom items
* Use English for material, object and texture names.
* Use meter for unit of length.
* Your PR should include all source files (e.g. `.png`, `.blend`) of your models (for later editing).
* Your PR must include the glTF binary files (`.glb`) of your models.
* Add a locale key `room.furnitures.YOUR_ITEM` at [`/locales/ja-JP.yml`](/locales/ja-JP.yml).
* Add a furniture definition at [`src/client/scripts/room/furnitures.json5`](src/client/scripts/room/furnitures.json5).

If you have no experience on 3D modeling, we suggest to use the free 3DCG software [Blender](https://www.blender.org/).
You can find information on glTF 2.0 at [glTF 2.0 — Blender Manual]( https://docs.blender.org/manual/en/dev/addons/io_scene_gltf2.html).

## Notes
### How to resolve conflictions occurred at yarn.lock?

Just execute `yarn` to fix it.

### placeholder
SQLをクエリビルダで組み立てる際、使用するプレースホルダは重複してはならない
例えば
``` ts
query.andWhere(new Brackets(qb => {
	for (const type of ps.fileType) {
		qb.orWhere(`:type = ANY(note.attachedFileTypes)`, { type: type });
	}
}));
```
と書くと、ループ中で`type`というプレースホルダが複数回使われてしまいおかしくなる
だから次のようにする必要がある
```ts
query.andWhere(new Brackets(qb => {
	for (const type of ps.fileType) {
		const i = ps.fileType.indexOf(type);
		qb.orWhere(`:type${i} = ANY(note.attachedFileTypes)`, { [`type${i}`]: type });
	}
}));
```

### Not `null` in TypeORM
```ts
const foo = await Foos.findOne({
	bar: Not(null)
});
```
のようなクエリ(`bar`が`null`ではない)は期待通りに動作しない。
次のようにします:
```ts
const foo = await Foos.findOne({
	bar: Not(IsNull())
});
```

### `null` in SQL
SQLを発行する際、パラメータが`null`になる可能性のある場合はSQL文を出し分けなければならない
例えば
``` ts
query.where('file.folderId = :folderId', { folderId: ps.folderId });
```
という処理で、`ps.folderId`が`null`だと結果的に`file.folderId = null`のようなクエリが発行されてしまい、これは正しいSQLではないので期待した結果が得られない
だから次のようにする必要がある
``` ts
if (ps.folderId) {
	query.where('file.folderId = :folderId', { folderId: ps.folderId });
} else {
	query.where('file.folderId IS NULL');
}
```

### `[]` in SQL
SQLを発行する際、`IN`のパラメータが`[]`(空の配列)になる可能性のある場合はSQL文を出し分けなければならない
例えば
``` ts
const users = await Users.find({
	id: In(userIds)
});
```
という処理で、`userIds`が`[]`だと結果的に`user.id IN ()`のようなクエリが発行されてしまい、これは正しいSQLではないので期待した結果が得られない
だから次のようにする必要がある
``` ts
const users = userIds.length > 0 ? await Users.find({
	id: In(userIds)
}) : [];
```

### 配列のインデックス in SQL
SQLでは配列のインデックスは**1始まり**。
`[a, b, c]`の `a`にアクセスしたいなら`[0]`ではなく`[1]`と書く

### `undefined`にご用心
MongoDBの時とは違い、findOneでレコードを取得する時に対象レコードが存在しない場合 **`undefined`** が返ってくるので注意。
MongoDBは`null`で返してきてたので、その感覚で`if (x === null)`とか書くとバグる。代わりに`if (x == null)`と書いてください

### Migration作成方法
```
npx ts-node ./node_modules/typeorm/cli.js migration:generate -n 変更の名前
```

作成されたスクリプトは不必要な変更を含むため除去してください。

### コネクションには`markRaw`せよ
**Vueのコンポーネントのdataオプションとして**misskey.jsのコネクションを設定するとき、必ず`markRaw`でラップしてください。インスタンスが不必要にリアクティブ化されることで、misskey.js内の処理で不具合が発生するとともに、パフォーマンス上の問題にも繋がる。なお、Composition APIを使う場合はこの限りではない(リアクティブ化はマニュアルなため)。

### JSONのimportに気を付けよう
TypeScriptでjsonをimportすると、tscでコンパイルするときにそのjsonファイルも一緒にdistディレクトリに吐き出されてしまう。この挙動により、意図せずファイルの書き換えが発生することがあるので、jsonをimportするときは書き換えられても良いものかどうか確認すること。書き換えされて欲しくない場合は、importで読み込むのではなく、`fs.readFileSync`などの関数を使って読み込むようにすればよい。

## その他
### HTMLのクラス名で follow という単語は使わない
広告ブロッカーで誤ってブロックされる

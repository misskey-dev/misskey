# コントリビューションの手引き
:v: この度は、ご協力ありがとうございます :v:

## Issues
Feature suggestions and bug reports are filed in https://github.com/syuilo/misskey/issues .
機能の要望やバグ報告は https://github.com/xeltica/groundpolis/issues でお願いします

* 重複を防ぐため、なるべく存在するissueがないか検索してください。もし既に同様の issue があれば、リアクションやコメントを追加して upvote してください。
* もし複数の独立した issue があるならば、それぞれの issue は別々に作成してください。

## ブランチ
* **master** ブランチは、最新版の変更を含むブランチです。
* **develop** ブランチは次期バージョンリリースのための作業ブランチです。


## 国際化 (i18n)
Misskey は [Vue I18n](https://github.com/kazupon/vue-i18n) という Vue.js 向けプラグインを使用しています。
Vue I18n の文書は http://kazupon.github.io/vue-i18n/introduction.html にあります。

## 文書
* コントリビューター向けの文書は [`/docs`](/docs) にあります。
* インスタンス管理者向けの文書は [`/docs`](/docs) にあります。
* エンドユーザー向けの文書は [`/src/docs`](/src/docs) にあります。

## テスト
* テストコードは [`/test`](/test) にあります。

## Groundpolis Room へのアイテム追加
* マテリアル、オブジェクト、テクスチャなどの名前は英語で書いてください。
* 長さの単位にはメートルを使用してください。
* (今後編集するために) プルリクエストにはモデルを構成する全てのソースファイル( `.png`, `.blend` など)を含めてください。
* プルリクエストにはモデルの glTF バイナリファイル (`.glb`)を含めなければなりません。
* `room.furnitures.YOUR_ITEM` といったロケールキーを [`/locales/ja-JP.yml`](/locales/ja-JP.yml) に追加してください。
* [`/src/client/app/common/scripts/room/furnitures.json5`](/src/client/app/common/scripts/room/furnitures.json5) に家具の定義を追加してください。

3D モデル制作の経験をお持ちでなければ、我々はフリーの 3DCG ソフトウェア [Blender](https://www.blender.org/) をお勧めします。
glTF 2.0 に関する資料は [glTF 2.0 — Blender Manual]( https://docs.blender.org/manual/en/dev/addons/io_scene_gltf2.html) にあります。

## よくある質問
### yarn.lock で発生したコンフリクトはどうすれば良いですか？

単純に `yarn` コマンドを実行してください。

## Glossary
### AP
_**A**ctivity**P**ub_ の略。

### MFM
_**M**isskey **F**lavored **M**arkdown_ の略。

### Mk
_**M**iss**k**ey_ の略。

### SW
_**S**ervice**W**orker_ の略。

### Nyaize
「な」が「にゃ」ににゃりますにゃん。

#### Denyaize
Nyaize を元にもどすにゃん。

## TypeScript コーディング規約
### セミコロンを省かない
自動セミコロン挿入(ASI) ハザードを防ぐために。

詳細:
* https://www.ecma-international.org/ecma-262/#sec-automatic-semicolon-insertion
* https://github.com/tc39/ecma262/pull/1062

### 基本的に括弧を省かない
ダメ:
``` ts
if (foo)
	bar;
else
	baz;
```

良い:
``` ts
if (foo) {
	bar;
} else {
	baz;
}
```

次のような特殊なケースにおいて、括弧を省いても構いません:

* `if` ステートメントが 1 つのステートメントのみを持ち、
* `else` を含まない場合

良い:
``` ts
if (foo) bar;
```
条件および、本体となるステートメントを同一行に記述してください。

### `===` が使える場合、 `==` を使わない
🥰

### 真偽値 (もしくは null 系) の値のみ `if` ステートメントの条件に使うこ
ダメ:
``` ts
if (foo.length)
```

良い:
``` ts
if (foo.length > 0)
```

### `export default` を使用しない
現在の言語サポートが `export default` と相性が悪いので...

参照:
* https://basarat.gitbooks.io/typescript/docs/tips/defaultIsBad.html
* https://gfx.hatenablog.com/entry/2017/11/24/135343

ダメ:
``` ts
export default function(foo: string): string {
```

良い:
``` ts
export function something(foo: string): string {
```

## ディレクトリ構造
```
src ... ソースコード
	@types ... 型定義
	prelude ... 副作用のない JS コーディングのための独立したユーティリティ
	misc ... 副作用のない Groundpolis のための独立したユーティリティ
	service ... 副作用を含む共通の関数
	queue ... ジョブキューとジョブ
	server ... ウェブサーバー
	client ... クライアント
	mfm ... MFM

test ... テストコード

```

## Notes
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

### 簡素な`undefined`チェック
データベースからレコードを取得するときに、プログラムの流れ的に(ほぼ)絶対`undefined`にはならない場合でも、`undefined`チェックしないとTypeScriptに怒られます。
でもいちいち複数行を費やして、発生するはずのない`undefined`をチェックするのも面倒なので、`ensure`というユーティリティ関数を用意しています。
例えば、
``` ts
const user = await Users.findOne(userId);
// この時点で user の型は User | undefined
if (user == null) {
	throw 'missing user';
}
// この時点で user の型は User
```
という処理を`ensure`を使うと
``` ts
const user = await Users.findOne(userId).then(ensure);
// この時点で user の型は User
```
という風に書けます。
もちろん`ensure`内部でエラーを握りつぶすようなことはしておらず、万が一`undefined`だった場合はPromiseがRejectされ後続の処理は実行されません。
``` ts
const user = await Users.findOne(userId).then(ensure);
// 万が一 Users.findOne の結果が undefined だったら、ensure でエラーが発生するので
// この行に到達することは無い
// なので、.then(ensure) は
// if (user == null) {
//	throw 'missing user';
// }
// の糖衣構文のような扱いです
```

### Migration作成方法
```
npx ts-node ./node_modules/typeorm/cli.js migration:generate -n 変更の名前
```

作成されたスクリプトは不必要な変更を含むため除去してください。

## その他
### HTMLのクラス名で follow という単語は使わない
広告ブロッカーで誤ってブロックされる

# Contribution guide
:v: Thanks for your contributions :v:

## Issues
Feature suggestions and bug reports are filed in https://github.com/syuilo/misskey/issues .

* Please search existing issues to avoid duplication. If your issue is already filed, please add your reaction or comment to the existing one.
* If you have multiple independent issues, please submit them separately.


## Localization (l10n)
Misskey uses [Crowdin](https://crowdin.com/project/misskey) for localization management.
You can improve our translations with your Crowdin account.
Changes you make in Crowdin will be merged into develop branch.

If you can't find the language you want to contribute with, please open an issue.

![Crowdin](https://d322cqt584bo4o.cloudfront.net/misskey/localized.svg)

## Internationalization (i18n)
Misskey uses [vue-i18n](https://github.com/kazupon/vue-i18n).

## Documentation
* Documents for contributors are located in [`/docs`](/docs).
* Documents for instance admins are located in [`/docs`](/docs).
* Documents for end users are located in [`/src/docs`](/src/docs).

## Test
* Test codes are located in [`/test`](/test).

## Continuous integration
Misskey uses CircleCI for automated test.
Configuration files are located in [`/.circleci`](/.circleci).

## Glossary
### AP
Stands for _**A**ctivity**P**ub_.

### MFM
Stands for _**M**isskey **F**lavored **M**arkdown_.

### Mk
Stands for _**M**iss**k**ey_.

### SW
Stands for _**S**ervice**W**orker_.

### Nyaize
Convert な(na) to にゃ(nya)

#### Denyaize
Revert Nyaize

## Code style
### セミコロンを省略しない
ASI Hazardを避けるためでもある

### 中括弧を省略しない
Bad:
``` ts
if (foo)
	bar;
else
	baz;
```

Good:
``` ts
if (foo) {
	bar;
} else {
	baz;
}
```

ただし**`if`が一行**の時だけは省略しても良い
Good:
``` ts
if (foo) bar;
```

### `export default`を使わない
インテリセンスと相性が悪かったりするため

参考:
* https://gfx.hatenablog.com/entry/2017/11/24/135343
* https://basarat.gitbooks.io/typescript/docs/tips/defaultIsBad.html

Bad:
``` ts
export default function(foo: string): string {
```

Good:
``` ts
export function something(foo: string): string {
```

## Directory structure
```
src ... Source code
	@types ... Type definitions
	prelude ... Independence utils for coding JavaScript without side effects
	misc ... Independence utils for Misskey without side effects
	service ... Common functions with side effects
	queue ... Job queues and Jobs
	server ... Web Server
	client ... Client
	mfm ... MFM

test ... Test code

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

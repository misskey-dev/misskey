# Coding guidelines

実装する人向けの共通規約・設計方針。領域固有の規約は [Frontend](frontend.md)・[Backend](backend.md) を参照する。

[Contribution guide](../../CONTRIBUTING.md)

## Misskeyのドメイン固有の概念は`Mi`をprefixする
例えばGoogleが自社サービスをMap、Earth、DriveではなくGoogle Map、Google Earth、Google Driveのように命名するのと同じ
コード上でMisskeyのドメイン固有の概念には`Mi`をprefixすることで、他のドメインの同様の概念と区別できるほか、名前の衝突を防ぐ。
ただし、文脈上Misskeyのものを指すことが明らかであり、名前の衝突の恐れがない場合は、一時的なローカル変数に限って`Mi`を省略してもよい。

## JSONのimportに気を付けよう
TypeScriptでjsonをimportすると、tscでコンパイルするときにそのjsonファイルも一緒にdistディレクトリに吐き出されてしまう。この挙動により、意図せずファイルの書き換えが発生することがあるので、jsonをimportするときは書き換えられても良いものかどうか確認すること。書き換えされて欲しくない場合は、importで読み込むのではなく、`fs.readFileSync`などの関数を使って読み込むようにすればよい。

## 命名規則

本来それが略称であっても、通常それでひとつのワードとして用いられるものは、略称として扱わない。

### 例: IP address

Good: `ipAddress` / `IpAddress`

Bad: `IPAddress`

### 例: User ID

Good: `userId` / `UserId`

Bad: `userID` / `UserID`

### 例: XMLなHTTPのRequest

Good: `xmlHttpRequest` / `XmlHttpRequest`

Bad: `XMLHttpRequest` / `XMLHTTPRequest`

## 関数化の基準

汎用性が低く(例えばそれを関数化したとしてもその呼び出しが元の場所一か所しか存在しない)、内容も短い処理(例えば10行以下)は、かえって読みにくくなるため、関数化しない。

また、関数化する場合でも、呼び出しがある特定のスコープに限られる場合は、そのスコープ内に閉じ込めた方が分かりやすく簡潔になる場合がある(ただし本来その処理に不要であっても、構造上親のスコープにある関係のない変数や引数にもアクセスできるようになるため、必ずしもそうすれば設計上綺麗になるというわけでもない。状況に応じて判断すべし)。

Bad:

``` ts
function withBrankets(x) {
	return `(${x})`;
}

function formatPercent(x) {
	return `${x}%`;
}

function formatValue(x) {
	return withBrankets(formatPercent(x));
}

function showData(a, b) {
	console.log(formatValue(a));
	console.log(formatValue(b));
}
```

Good:

``` ts
function formatValue(x) {
	return `(${x}%)`;
}

function showData(a, b) {
	console.log(formatValue(a));
	console.log(formatValue(b));
}
```

or

``` ts
function showData(a, b) {
	function formatValue(x) {
		return `(${x}%)`;
	}

	console.log(formatValue(a));
	console.log(formatValue(b));
}
```

or

``` ts
function showData(a, b) {
	console.log(`(${a}%)`);
	console.log(`(${b}%)`);
}
```

## indexというファイル名を使うな
ESMではディレクトリインポートは廃止されているのと、ディレクトリインポートせずともファイル名が index だと何故か一部のライブラリ？でディレクトリインポートだと見做されてエラーになる

## 考え方
### DRYに囚われるな
必要なのは一般化ではなく抽象化と考えます。
盲信せず、誤った・不必要な共通化は避け、それが自然だと感じる場合は重複させる勇気を持ちましょう。

### Misskeyを複雑にしない実装
それがいくら複雑であっても、Misskey固有のコンテキストと関心が分離されている(もしくは事実上分離されていると見做すことができる)実装であれば、それはMisskeyのコードベースに対する複雑性に影響を与えないと考えます。

例えるなら、VueやAiScriptといったMisskeyが使用しているライブラリの内部実装がいくら複雑だったとしても、「それを使用しているからMisskeyの実装は複雑である」ということにはならないのと同じです。

Misskeyのドメイン知識から関心が分離されているということは、Misskeyの実装について考える時にそれらの内部実装を考慮する必要が無く、認知負荷を増やさないからです。

また重要な点は、その実装が、Misskeyリポジトリの外部にあるか・内部にあるかということや、Misskeyがメンテナンスするものか・第三者がメンテナンスするものかといったことは複雑性を考える上ではほとんど無視できるという点です。

もちろんその実装がMisskeyリポジトリにあり、Misskeyがメンテナンスしなければならないものは、保守のコストはかかります。
しかし、Misskeyの本質的な設計・実装という観点で見たときは、その実装は実質的に外部ライブラリのように振る舞います。
換言すれば「たまたまMisskeyの開発者と同じ人たちがメンテナンスしているし、たまたまMisskeyのリポジトリ内に置いてあるだけの外部ライブラリ」です。

そのため、実装をなるべくMisskeyのドメイン知識から独立したものにすれば、Misskeyのコードベースの複雑性を上げることなく機能実装を行うことができ、お得であると言えます。
もちろんそれにこだわって、些細な実装でもそのように分離してしまうとかえって認知負荷が増えたり、実装量が増えてメリットをデメリットが上回る場合もあるので、ケースバイケースではあります。

### AIに誤解されにくいコードを書こう

AI(LLM)によるレビューやコーディング補助時にハルシネーションのもとになるので、AIが誤解・混乱しそうなコードは避けるかコメントを残そう。

AIにとって分かりやすいコードは、結果的に人間にとっても分かりやすいコードに繋がります。

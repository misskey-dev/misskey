# About Misskey

Misskey is an open-source and distributed platform for microblogging. Development was started in 2014 by syuilo in Japan. It features an abundance of features such as Drive or Reactions as well as a very high UI customizability.

## History
開発当初は掲示板がメインのサービスでしたが、ユーザーが短文を投稿し、それを時系列で流れるタイムライン機能を追加したところ人気が高まり、徐々にそれがメインとして開発が進むようになりました。 当初は分散型ではありませんでしたが、2018年にAcitivityPubを実装し分散型になったことで、より多くの方に認知され利用されるサービスになり、現在に至ります。
<div class="info">ℹ️ The name "Misskey" comes from a song called "Brain Diver" by a band that syuilo used to listen to at the time called May'n.</div>

With anyone being able to join its development, Misskey is still continually being actively developed.

## What does "Distributed" mean?
A <b>Distributed</b> service, also called a <b>Decentralized</b> service, refers to a service which features the division of a community into many servers that all mutually <b>communicate (federate)</b> with each other to share their contents, building a <b>network (Fediverse)</b>. Services for which only one server exists, or for which many independent server exist, are called centralized. Most services fall under the category of centralized, some examples for this are Twitter or Facebook. The advantage of distributed services is being able to select the administration or server theme that suits you freely.It's also possible for you to make your own server.Thanks to the federated nature, you will be able to access the same community, no matter which server you choose.

## Always Open-Source
Misskey has always been, and will always be, open source.Open source means, simply speaking, <b>making the source code of software (a program) publicly available</b>.This also includes being able to adjust or redistribute the source code in its definition. The entirety of Misskey's source code is [being licensed](https://github.com/misskey-dev) under an open-source license called [AGPL](https://github.com/misskey-dev/misskey/blob/develop/LICENSE), which means anyone can freely inspect, use, adjust, change or redistribute as they see fit. Open source has many merits, including allowing anyone being able to make changes as they like, to make sure the code does not include any harmful components and being able to easily participate in its development. For realizing the distributed nature of Misskey, this concept of open source is indispensable. Using the same example as before, most profit-oriented services like Twitter, Facebook etc. are not open source.

<div class="info">ℹ️ Technically speaking, Misskey's source code is being managed via Git, and its repository is being hosted at <a href="https://github.com/misskey-dev" target="_blank">GitHub.</a></div>

## Joining development and supporting the project
If you like Misskey, please support the project.Supporting the project can be done in many ways, with some of them introduced below.Some of these do not require programming skills, so anyone can feel free to support Misskey their own way.We're always waiting for you.

### Adding features or fixing bugs
If you possess software engineering skills, you can contribute to the project through editing its source code. For guidelines regarding this, please see [here](https://github.com/misskey-dev/misskey/blob/develop/CONTRIBUTING.md).

### Participating in discussions
You can contribute by sharing your opinion on new or existing features, as well as by reporting bugs. Such discussions can be held at [GitHub](https://github.com/misskey-dev) or the [Forums](https://forum.misskey.io/) etc.

### Translating text
Misskey is available in many languages (also called i18n, which is an abbreviation for Internationalization).While the original language is generally japanese, volunteers are translating Misskey into other languages. Helping out with this translation work is also a form of contributing. Misskey uses a service called [Crowdin to manage its translations.](https://crowdin.com/project/misskey)

### Sharing your impressions
Besides reporting bugs, please also feel free to share positive impressions such as which parts of Misskey you personally like, or things about Misskey that you find fun.As things like these serve as motivation for the developers, it also counts as indirect support for the project.

### Increasing the number of Misskists
"Misskist" refers to the people using Misskey. By spreading the word about Misskey through introducing it to your acquaintances, the number of Misskists may increase, which serves as motivation for the developers.

### Making donations
Misskeyはビジネスではなく、利用は無料であるため、収益は皆様からの寄付のみです。(インスタンスによっては広告収入を得ているような場合もありますが、それは運営者の収入であり直接開発者への収入にはなりません) 寄付をしていただければ、今後も開発を続けることが可能になり、プロジェクトへの貢献になります。 寄付は基本的には[Patreon](https://www.patreon.com/syuilo)で受け付けています。 一定額寄付していただけると、Misskeyの[情報ページ](/about-misskey)に名前を記載することができます。

また、サーバーの運営者も、基本的には収益を得ていません。サーバーの運営にはコストがかかるので、運営者の支援をすることもご検討ください。 開発には直接関係しませんが、サーバーがあってこそのプロジェクトなので、運営が維持されるというのは開発と同じくらい重要なことです。

## Credits
A list of Misskey's developers and donators can be seen [here](/about-misskey).

## Frequently Asked Questions
### What is this project aiming to achieve?
強いて言うと、漠然的になりますが広く使われる汎用的なプラットフォームになることを目指しています。 Misskeyは他のプロジェクトとは違い、何らかの思想(例えば、反中央集権)やビジョンに基づいて開発が行われているわけではなく、その点ではフラットです。 それが逆に、特定の方向性に縛られないフレキシブルさを生み出すことに繋がっていると感じています。
<!-- TODO: ここにロードマップへのリンク -->

### Is Misskey being developed by a company?
いいえ。Misskeyの開発は個人で行われており、商業的でもないため、特定の企業の関りはありません。 開発メンバーも基本的にはボランティアです。 また、開発に対し企業のスポンサーがつくこともありますが、その場合でもやはり開発は個人のコミュニティが主体です。

### Who is managing Misskey?
Misskeyは分散型なため、各サーバーにそれぞれ異なった運営者がいます。従って、特定の個人や企業によって、Misskeyの全てが運営されているわけではありません。 また、開発チームが運営を行うわけでもないため、運営に関する連絡は、お使いのサーバーの運営者に行ってください。 サーバーの運営者は、[このページ](/about)で確認することができます。 あなたがサーバーを作成すれば、あなたが運営者になります。

### Which server should I choose?
[サーバー一覧が公開されています。](https://join.misskey.page/ja-JP/instances) サーバーによってコミュニティのテーマ(特定のこと、ものが好き 等)が決められている場合があるので、自分に合ったテーマのサーバーがあれば、そこを選ぶと良いかもしれません。 他にも、サーバーの規模、ユーザー層、国および言語、運営者が信頼できるかどうか、などの観点があります。 なお、Misskey公式のサーバーというものはありません。自身で新しくサーバーを作成するという選択肢もあります。

基本的にどのサーバーを選んだとしても、他の全てのサーバーのユーザーと繋がることができます。

### How can I create my own server?
Thank you for having an interest in creating a Misskey server. In the current year of 2021 there is no specialized Misskey hosting service, so creating a new server requires a certain amount of knowledge. Please see [here](todo) for more information regarding this.

### What kind of technology does Misskey use?
As development on Misskey progressed, the technology it has used has changed greatly.In the beginning, it used a combination of MySQL + PHP + jQuery, but currently uses the following.
- Server-side: Node.js
- Database: PostgreSQL, Redis
- UI Framework: Vue.js
- Programming language: TypeScript

In addition to this, from Misskey derived technology such as MFM or AiScript are also being used.

### Is this a fork of Mastodon?
No.Misskey is a project completely different from Mastodon or other alike projects. It has been in development for a long time already.However, it only became a distributed network after the appearance of Mastodon. Besides both projects implementing the ActivityPub protocol, there is no relation between the two.

### Are there any apps for iOS / Android available?
While no official Misskey app for either OS exists, there are several third-party applications. For details, please check [here](./apps).

However, functionality of third-party applications will inevitably lag behind the official Web client, so unless you really want to use a native application, we recommend the official Web client instead. As the Misskey Web client supports PWA, it is possible to make it act as if it was a native application instead. For details regarding this, please check [here](todo).

### Where can I download Misskey's logo or icon?
(Coming soon)

### Who's that cute cat-eared girl that you see sometimes?
It's Misskey's guardian deity, Ai.(They called Ai cute, yay!)
<div class="info">ℹ️ To read more about Ai, check <a href="https://xn--931a.moe/" target="_blank">here</a> (Japanese-only).</div>

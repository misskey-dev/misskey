# About Misskey

Misskeyはオープンソースの分散型マイクロブログプラットフォームプロジェクトです。 開発は日本でsyuiloによって2014年から開始されました。 ドライブ、リアクションなどの豊富な機能や、高いカスタマイズ性を備えたUIを持つことが特徴です。

## History
開発当初は掲示板がメインのサービスでしたが、ユーザーが短文を投稿し、それを時系列で流れるタイムライン機能を追加したところ人気が高まり、徐々にそれがメインとして開発が進むようになりました。 当初は分散型ではありませんでしたが、2018年にAcitivityPubを実装し分散型になったことで、より多くの方に認知され利用されるサービスになり、現在に至ります。
<div class="info">ℹ️ Misskeyという名前は、syuiloが当時聴いていたMay'nというアーティストの楽曲、Brain Diverの歌詞に由来します。</div>

誰でも開発に参加することができ、現在でも活発に開発が続いています。

## What does "Distributed" mean?

<b>分散(distributed)型</b>とは、<b>非中央集権(decentralized)</b>とも呼ばれ、コミュニティが多数のサーバーに分散して存在し、それらが相互に<b>通信(連合、federation)</b>することでコンテンツ共有<b>ネットワーク(Fediverse)</b>を形成していることが特徴のサービスです。 単一のサーバーしか存在しない、もしくは複数存在しても互いに独立している場合は中央集権なサービスと言われ、例えばTwitterやFacebookなどほとんどのサービスがそれに該当します。 分散型のメリットは、自分に合った運営者やテーマのサーバーを選択できることです。自分でサーバーを作成することもできます。連合するおかげで、どのサーバーを選んでも、同じコミュニティにアクセスできます。

## Always Open-Source
Misskeyはこれまでもこれからも、オープンソースであり続けます。オープンソースとは、簡単に言うと<b>ソフトウェアのソースコード(プログラム)が公開されている</b>ことです。ソースコードの修正や再配布が可能であることを定義に含めることもあります。 Misskeyのすべてのソースコードは[AGPL](https://github.com/misskey-dev/misskey/blob/develop/LICENSE)というオープンソースライセンスの下に[公開](https://github.com/misskey-dev)されていて、誰でも自由に閲覧、使用、修正、改変、再配布をすることができます。 オープンソースは、自分で好きなように変えたり、有害な処理が含まれていないことを確認することができたり、誰でも開発に参加できるなどの、様々なメリットがあります。 上述の分散型を実現するためにも、オープンソースであるということは必要不可欠な要素です。 再び引き合いに出しますが、TwitterやFacebookなどの利益を得ているほとんどのサービスはオープンソースではありません。

<div class="info">ℹ️ 技術的に言うと、MisskeyのソースコードはGitで管理されていて、リポジトリは<a href="https://github.com/misskey-dev" target="_blank">GitHub上でホスティングされています。</a></div>

## Joining development and supporting the project
Misskeyを気に入っていただけたら、ぜひプロジェクトを支援してください。プロジェクトに貢献するには、以下で紹介するようにいろいろな方法があります。方法によっては開発のスキルは不要なので、誰でも気軽に参加し貢献することができます。いつでもお待ちしています。

### Adding features or fixing bugs
ソフトウェアエンジニアのスキルをお持ちの方であれば、ソースコードを編集する形でプロジェクトに貢献することができます。 貢献についてのガイドは[こちら](https://github.com/misskey-dev/misskey/blob/develop/CONTRIBUTING.md)です。

### Participating in discussions
新しい機能、または既存の機能について意見を述べたり、不具合を報告したりすることでも貢献できます。 そのようなディスカッションは[GitHub](https://github.com/misskey-dev)上か、[フォーラム](https://forum.misskey.io/)等で行われます。

### Translating text
Misskeyは様々な言語に対応しています(i18n -internationalizationの略- と呼ばれます)。元の言語は基本的に日本語ですが、有志によって他の言語へと翻訳されています。 その翻訳作業に加わっていただくことでもMisskeyに貢献できます。 Misskeyは[Crowdinというサービスを使用して翻訳の管理を行っています。](https://crowdin.com/project/misskey)

### Sharing your impressions
不具合報告等だけではなく、Misskeyの良い点、楽しい点といったポジティブな意見もぜひ共有してください。開発の励みになり、それは間接的ですがプロジェクトへの貢献です。

### Increasing the number of Misskists
ミスキストとは、Misskeyを使用する人のことです。 知り合いに紹介するなどしてMisskeyを広めていただければ、ミスキストが増え開発のモチベーションが上がります。

### Making donations
Misskeyはビジネスではなく、利用は無料であるため、収益は皆様からの寄付のみです。(インスタンスによっては広告収入を得ているような場合もありますが、それは運営者の収入であり直接開発者への収入にはなりません) 寄付をしていただければ、今後も開発を続けることが可能になり、プロジェクトへの貢献になります。 寄付は基本的には[Patreon](https://www.patreon.com/syuilo)で受け付けています。 一定額寄付していただけると、Misskeyの[情報ページ](/about-misskey)に名前を記載することができます。

また、サーバーの運営者も、基本的には収益を得ていません。サーバーの運営にはコストがかかるので、運営者の支援をすることもご検討ください。 開発には直接関係しませんが、サーバーがあってこそのプロジェクトなので、運営が維持されるというのは開発と同じくらい重要なことです。

## Credits
Misskeyの開発者や、Misskeyに寄付をしてくださった方の一覧は[こちら](/about-misskey)で見ることができます。

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
Misskeyサーバーの作成に興味を持っていただきありがとうございます。 2021年現在、Misskeyのホスティングサービスは存在しないため、サーバーの作成にはある程度の知識が必要です。 サーバーの作成方法については[こちら](todo)をご覧ください。

### What kind of technology does Misskey use?
As development on Misskey progressed, the technology it has used has changed greatly.In the beginning, it used a combination of MySQL + PHP + jQuery, but currently uses the following.
- Server-side: Node.js
- Database: PostgreSQL, Redis
- UI Framework: Vue.js
- Programming language: TypeScript

In addition to this, from Misskey derived technology such as MFM or AiScript are also being used.

### Is this a fork of Mastodon?
No.Misskey is a project completely different from Mastodon or other alike projects. It has been in development for a long time already.However, it only became a distributed network after the appearance of Mastodon. Besides both projects implementing the ActivityPub protocol, there is no relation between the two.

### "Are there any apps for iOS / Android available?"
While no official Misskey app for either OS exists, there are several third-party applications. For details, please check [here](./apps).

However, functionality of third-party applications will inevitably lag behind the official Web client, so unless you really want to use a native application, we recommend the official Web client instead. As the Misskey Web client supports PWA, it is possible to make it act as if it was a native application instead. For details regarding this, please check [here](todo).

### Where can I download Misskey's logo or icon?
(Coming soon)

### Who's that cute cat-eared girl that you see sometimes?
It's Misskey's guardian deity, Ai.ｱｲﾁｬﾝｶﾜｲｲﾔｯﾀｰ!
<div class="info">ℹ️ To read more about Ai, check <a href="https://xn--931a.moe/" target="_blank">here</a> (Japanese-only).</div>

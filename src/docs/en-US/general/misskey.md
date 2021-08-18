# About Misskey

Misskey is an open-source and distributed platform for microblogging. Development was started in 2014 by syuilo in Japan. It features an abundance of features such as Drive or Reactions as well as a very high UI customizability.

## History
While Misskey started centered around Bulletin Boards as its main feature, the growth in popularity due to the addition of a timeline that let users post short messages and view them in chronological order lead to a gradual shift in the main focus of development towards this kind of functionality. Misskey was not always a decentralized service, but became decentralized through the adoption of ActivityPub in 2018. Since then, it has become a service that is acknowledged and used by many.
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
Misskey is not a business, and stays free to use by receiving its earnings through donations from everyone.(Depending on the instance, some revenue may be earned through showing advertisments, but these earnings go straight to the instance administrator and not to the developers of Misskey) As donations make it possible for the project to continue to be developed, they are another way of supporting Misskey. Donations are generally accepted via [Patreon](https://www.patreon.com/syuilo). By donating a certain amount of money, you can also have your username displayed on Misskey's [About page](/about-misskey).

In addition to this, server administrators are also generally speaking not earning revenue.As operating a server costs money, please also consider supporting your server's administrator. This does not have a direct relation to the development of Misskey, but the existence of servers is what makes up the project, meaning the continued existence of servers is just about as important as that of the project itself.

## Credits
A list of Misskey's developers and donators can be seen [here](/about-misskey).

## Frequently Asked Questions
### What is this project aiming to achieve?
To put it bluntly, while this is a bit vague, Misskey is aiming to be a widely-used all-purpose platform. Unlike other platforms, Misskey is not grounded in a specific idea (for example, anti-centralization) or vision and being developed with that in mind, so it's a bit "aimless" in this respect. On the other hand though, this creates a flexibility due to not being bound by a specific direction to go towards.
<!-- TODO: ここにロードマップへのリンク -->

### Is Misskey being developed by a company?
No.Misskey is being developed by an individual person and not commercialized through connection with any particular company. Development members are generally volunteers. Additionally, while there are some corporate sponsors, development is still centered around the community.

### Who is managing Misskey?
Due to the distributed nature of Misskey, each individual server has their own administration.Therefore, not all of Misskey is managed by one individual person or company. This means that, as the development team does not control individual servers, for management-related questions you should contact your server's administration instead. You can verify who is managing your individual server on [this page](/about). If you were to create a server, then you would also become its administrator.

### Which server should I choose?
[You can find an (incomplete) list of servers here.](https://join.misskey.page/ja-JP/instances) Depending on the server, its community or central theme (for example, liking a show) may vary, so if there is a server that suits your interests, joining it would likely be a good choice. Besides that, server size, userbase, country or spoken language, reliance or trust in the administration team and many other things can also serve as criteria. There is however no single server that serves as the official server of Misskey.You also have the choice of creating a new server of your own.

Generally speaking, no matter which server you join, you will still be able to connect with users from all other servers.

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

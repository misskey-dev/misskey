# Anatawa12's fork of Misskey

This is anatawa12's fork of Misskey.

This fork is used for several purposes:

- The repository for [vmimi-relay timeline] extension development. I'm the maintainer of the [vmimi-relay timeline].
- The repository for writing pull-requests to the vmimi relay users. I'm usually sending pull requests to the vmimi relay users after each updates.
- The repository for writing pull-requests to the upstream repository. I'm one of the contributors of the upstream repository.
- The repository for writing pull-requests to the [misskey.niri.la]. I'm one of the maintainers of the [misskey.niri.la].

This branch is the branch for releasing the Vmimi Relay Timeline extension.

## Vmimi Relay Timeline

The Vmimi Relay Timeline is additional timelines for Misskey servers who belong to the [Virtual Kemomimi Relay].
This extension adds two timelines: Vmimi Relay Timeline (VRTL) and Vmimi Social Timeline (VSTL).

ぶいみみリレータイムラインは[ぶいみみリレー][Virtual Kemomimi Relay]に参加しているサーバー向けのmisskeyの拡張タイムラインです。
この拡張はふたつのタイムラインを追加します: ぶいみみリレータイムライン (VRTL) とぶいみみソーシャルタイムライン (VSTL) です。

### Vmimi Relay Timeline (VRTL)

The Vmimi Relay Timeline (VRTL) is the timeline that shows the posts from the Virtual Kemomimi Relay users.
This timeline is designed to be similar to the Local Timeline,
but it shows the posts from the Virtual Kemomimi Relay users.

ぶいみみリレータイムライン (VRTL) はぶいみみリレーに参加しているユーザーの投稿を表示するタイムラインです。
このタイムラインはローカルタイムラインに似ていますが、ぶいみみリレーに参加しているユーザーの投稿を表示します。

### Vmimi Social Timeline (VSTL)

The Vmimi Social Timeline (VSTL) is the timeline that shows the posts from
the Virtual Kemomimi Relay users and the users you are following.
In other words, this timeline is the combination of the VRTL and the Home Timeline.
This timeline is designed to be similar to the Social Timeline,
but it shows the posts from the Virtual Kemomimi Relay users instead of the Local Timeline.

ぶいみみソーシャルタイムライン (VSTL) はぶいみみリレーに参加しているユーザーとフォローしているユーザーの投稿を表示するタイムラインです。
つまり、このタイムラインはVRTLとホームタイムラインの組み合わせです。
このタイムラインはソーシャルタイムラインに似ていますが、ローカルタイムラインの代わりにぶいみみリレーに参加しているユーザーの投稿を表示します。

### How to use the Vmimi Relay Timeline

First, this extension is designed for servers who joined the [Virtual Kemomimi Relay]
so you have to join the [Virtual Kemomimi Relay] to use this extension.

After that, you have two ways to use the Vmimi Relay Timeline:
- Use the my releases of the misskey docker image if you're using official docker image. (Not released yet)
  The image is designed to be a drop-in replacement of the official image.
  You can use `ghcr.io/anatawa12/vrtl-misskey:latest` as the image name.
- Merge the extension branch to your fork and build the image by yourself.
  You can merge the [`vmimi-relay-timeline`][vmimi-relay-timeline-branch] branch to your fork.
  If you ask me, I'll create a pull request to your fork. Feel free to ask me.

はじめに、この拡張は[ぶいみみリレー][Virtual Kemomimi Relay]に参加しているサーバー向けに設計されているため、この拡張を使用するには[ぶいみみリレー][Virtual Kemomimi Relay]に参加する必要があります。

その後、ぶいみみリレータイムラインを使用する方法はふたつあります:
- 公式のdockerイメージを使用している場合は、私のリリースを使用してください。(まだリリースされていません)
  のイメージは公式イメージのドロップイン置換として設計されています。
  メージ名として `ghcr.io/anatawa12/vrtl-misskey:latest` を使用できます。
- このブランチをあなたのフォークにマージして、自分でイメージをビルドしてください。
  `vmimi-relay-timeline`][vmimi-relay-timeline-branch] ブランチをあなたのフォークにマージする。
  必要であれば、あなたのフォークにプルリクエストを作成します。お気軽にお尋ねください。

### Branches related to Vmimi Relay Timeline

- [`vmimi-relay-timeline`][vmimi-relay-timeline-branch]:
  The branch for the Vmimi Relay Timeline extension development.
  All changes to the Vmimi Relay Timeline extension will be merged to this branch.
  This branch should be based on the latest official release of Misskey.
  This branch does not include any changes other than the Vmimi Relay Timeline extension itself.
- [`vmimi-relay-timeline-releases`][vmimi-relay-timeline-releases-branch]:
  The branch for releasing the Vmimi Relay Timeline extension.
  This branch includes the changes for `package.json` and changes to the repository link.
- `vmimi-relay-timeline-nirila`, `vmimi-relay-timeline-buiso` and other branches:
  Those branches are the branches for sending pull requests to each fork-based server.
  Those branches are not permanent; they will be deleted after each pull request is merged.

### How the Vmimi Relay Timeline works

The Vmimi Relay Timeline is implemented as a server-whitelisted timeline.

The Vmimi Relay provides the API endpoint to get the list of joined servers.
The Vmimi Relay Timeline extension fetches the list of joined servers from the Vmimi Relay
and filters the received / created notes by the list.
For implementation simplicity, the Vmimi Relay Timeline includes all public notes of the local server including
non-federated notes, but this behavior may change in the future.

[Virtual Kemomimi Relay]: https://relay.virtualkemomimi.net/
[misskey.niri.la]: https://github.com/niri-la/misskey.niri.la/
[vmimi-relay timeline]: #vmimi-relay-timeline
[vmimi-relay-timeline-branch]: https://github.com/anatawa12/misskey/tree/vmimi-relay-timeline
[vmimi-relay-timeline-releases-branch]: https://github.com/anatawa12/misskey/tree/vmimi-relay-timeline-releases

---

<div align="center">
<a href="https://misskey-hub.net">
	<img src="./assets/title_float.svg" alt="Misskey logo" style="border-radius:50%" width="400"/>
</a>

**🌎 **[Misskey](https://misskey-hub.net/)** is an open source, decentralized social media platform that's free forever! 🚀**

---

<a href="https://misskey-hub.net/servers/">
		<img src="https://custom-icon-badges.herokuapp.com/badge/find_an-instance-acea31?logoColor=acea31&style=for-the-badge&logo=misskey&labelColor=363B40" alt="find an instance"/></a>

<a href="https://misskey-hub.net/docs/for-admin/install/guides/">
		<img src="https://custom-icon-badges.herokuapp.com/badge/create_an-instance-FBD53C?logoColor=FBD53C&style=for-the-badge&logo=server&labelColor=363B40" alt="create an instance"/></a>

<a href="./CONTRIBUTING.md">
		<img src="https://custom-icon-badges.herokuapp.com/badge/become_a-contributor-A371F7?logoColor=A371F7&style=for-the-badge&logo=git-merge&labelColor=363B40" alt="become a contributor"/></a>

<a href="https://discord.gg/Wp8gVStHW3">
		<img src="https://custom-icon-badges.herokuapp.com/badge/join_the-community-5865F2?logoColor=5865F2&style=for-the-badge&logo=discord&labelColor=363B40" alt="join the community"/></a>

<a href="https://www.patreon.com/syuilo">
		<img src="https://custom-icon-badges.herokuapp.com/badge/become_a-patron-F96854?logoColor=F96854&style=for-the-badge&logo=patreon&labelColor=363B40" alt="become a patron"/></a>

---

[![codecov](https://codecov.io/gh/misskey-dev/misskey/branch/develop/graph/badge.svg?token=R6IQZ3QJOL)](https://codecov.io/gh/misskey-dev/misskey)

</div>

<div>

<a href="https://xn--931a.moe/"><img src="https://github.com/misskey-dev/misskey/blob/develop/assets/ai.png?raw=true" align="right" height="320px"/></a>

## ✨ Features
- **ActivityPub support**\
Not on Misskey? No problem! Not only can Misskey instances talk to each other, but you can make friends with people on other networks like Mastodon and Pixelfed!
- **Reactions**\
You can add emoji reactions to any post! No longer are you bound by a like button, show everyone exactly how you feel with the tap of a button.
- **Drive**\
With Misskey's built in drive, you get cloud storage right in your social media, where you can upload any files, make folders, and find media from posts you've made!
- **Rich Web UI**\
	Misskey has a rich and easy to use Web UI!
	It is highly customizable, from changing the layout and adding widgets to making custom themes.
	Furthermore, plugins can be created using AiScript, an original programming language.
- And much more...

</div>

<div style="clear: both;"></div>

## Documentation

Misskey Documentation can be found at [Misskey Hub](https://misskey-hub.net/docs/), some of the links and graphics above also lead to specific portions of it.

## Sponsors

<div align="center">
	<a class="rss3" title="RSS3" href="https://rss3.io/" target="_blank"><img src="https://rss3.mypinata.cloud/ipfs/QmUG6H3Z7D5P511shn7sB4CPmpjH5uZWu4m5mWX7U3Gqbu" alt="RSS3" height="60"></a>
</div>

## Thanks

<a href="https://www.chromatic.com/"><img src="https://user-images.githubusercontent.com/321738/84662277-e3db4f80-af1b-11ea-88f5-91d67a5e59f6.png" height="30" alt="Chromatic" /></a>

Thanks to [Chromatic](https://www.chromatic.com/) for providing the visual testing platform that helps us review UI changes and catch visual regressions.

<a href="https://about.codecov.io/for/open-source/"><img src="https://about.codecov.io/wp-content/themes/codecov/assets/brand/sentry-cobranding/logos/codecov-by-sentry-logo.svg" height="30" alt="Codecov" /></a>

Thanks to [Codecov](https://about.codecov.io/for/open-source/) for providing the code coverage platform that helps us improve our test coverage.

<a href="https://crowdin.com/"><img src="https://user-images.githubusercontent.com/20679825/230709597-1299a011-171a-4294-a91e-355a9b37c672.svg" height="30" alt="Crowdin" /></a>

Thanks to [Crowdin](https://crowdin.com/) for providing the localization platform that helps us translate Misskey into many languages.

<a href="https://hub.docker.com/"><img src="https://user-images.githubusercontent.com/20679825/230148221-f8e73a32-a49b-47c3-9029-9a15c3824f92.png" height="30" alt="Docker" /></a>

Thanks to [Docker](https://hub.docker.com/) for providing the container platform that helps us run Misskey in production.

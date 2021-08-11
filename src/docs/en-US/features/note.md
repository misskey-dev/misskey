# Notes
ノートは、Misskeyに投稿される、文章、ファイル、アンケートなどを含むコンテンツで、Misskeyの中心的概念です。また、そのノートを作成する行為自体もノートと呼ばれます。

ノートが作成されると、[タイムライン](./timeline)に追加され、自分の[フォロワー](./follow)やサーバーのユーザーが見れるようになります。

ノートには、[リアクション](./reaction)を行うことができます。You can also reply or quote notes.

By adding a note to your [Favorites](./favorite), you can easily look back at it at a later point in time.

## Composing notes
ノートを作成するには、画面上にある鉛筆マークのボタンを押して、作成フォームを開きます。作成フォームに内容を入力し、「ノート」ボタンを押すことでノートが作成されます。 ノートには、画像、動画など任意のファイルや、[アンケート](./poll)を添付することができます。また、本文中には[MFM](./mfm)が使用でき、[メンション](./mention)や[ハッシュタグ](./hashtag)を含めることもできます。 他にも、CWや公開範囲といった設定も行えます(詳細は後述)。
<div class="info">ℹ️ If you are on a computer and have an image saved in your clipboard, you can attach it to your note by using the usual paste shortcut within the text box.</div>
<div class="info">ℹ️You can also press <kbd class="key">Ctrl + Enter</kbd> within the text box to publish your note.</div>

## Renote
既にあるノートを引用、もしくはそのノートを新しいノートとして共有する行為、またそれによって作成されたノートをRenoteと呼びます。 自分がフォローしているユーザーの、気に入ったノートを自分のフォロワーに共有したい場合や、過去の自分のノートを再度共有したい場合に使います。 同じノートに対して無制限にRenoteを行うことができますが、あまり連続して使用すると迷惑になる場合もあるので、注意しましょう。
<div class="warn">⚠️If you've set your note's visibility to Followers-only or Direct, then renoting it will not be possible</div>

To take back a renote, press the "..." next to the renote timestamp and select "Take back Renote".

## CW
Contents Warningの略で、ノートの内容を、閲覧者の操作なしには表示しないようにできる機能です。主に長大な内容を隠すためや、ネタバレ防止などに使うことができます。 設定するには、フォームの「内容を隠す」ボタン(目のアイコン)を押します。すると新しい入力エリアが表れるので、そこに内容の要約を記入します。

## Visiblility
It's possible to individually set where your note will be visible (Visibility) for each of your notes.By pressing the icon to the left of the "Note" button in the post form, you can choose from the visibility settings listed below.

### Public
Your note will be visible to all users and will show up on all timelines (home, local, social, global).
<div class="warn">⚠️ This visibility will be unavailable if your account is <a href="./silence">silenced</a>.</div>

### Home
Your note will be visible to all users, but will not show up on the local, social or global timeline for non-followers.

### Followers
Your note will only be visible to those that are following you.The note will show up on all timelines of your followers.

### Direct
Your note will only be visible to individually specified users.The note will show up on all timelines of the specified users.

### The "Local only" option
If you enable this option, your note won't be federated to remote instances.

### Visibility comparison
<table>
    <tr><th></th><th>Public</th><th>Home</th><th>Followers</th><th>Direct</th></tr>
    <tr><th>LTL/STL/GTL of Followers</th><td>✔</td><td>✔</td><td>✔</td><td></td></tr>
    <tr><th>LTL/STL/GTL of Others</th><td>✔</td><td></td><td></td><td></td></tr>
</table>

## Pin to profile
By pinning a note to your profile it will be constantly displayed on your profile page. To pin a note, open the note menu and press "Pin to profile". It's also possible to pin multiple notes to your profile.

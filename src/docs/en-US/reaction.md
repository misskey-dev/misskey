# Reaction
他の人のノートに、絵文字を付けて簡単にあなたの反応を伝えられる機能です。 リアクションするには、ノートの + アイコンをクリックしてピッカーを表示し、絵文字を選択します。 リアクションには[カスタム絵文字](./custom-emoji)も使用できます。

## Customizing the reaction picker
It's possible to customize the emoji picker to display the emojis you want. You can configure it in the "Reactions" settings menu.

## About reacting to remote posts
Because reactions are a Misskey-original feature, unless the remote instance is also a Misskey instance, reactions to posts will be sent as a "Like" activity.一般的にはLikeは「お気に入り」として実装されているようです。 また、相手がMisskeyであったとしても、カスタム絵文字リアクションは伝わらず、自動的に「👍」等にフォールバックされます。

## About reactions from remote servers
If a "Like" activity is sent from a remote server, it will be interpreted as a "👍" reaction in Misskey.

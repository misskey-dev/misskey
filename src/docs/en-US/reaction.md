# Reaction
Easily express your feelings about the notes of others by attaching emojis to them. To react to a note, press the "+" icon to display the reaction picker and click on an emoji. You can also use [Custom Emoji](./custom-emoji) as reactions.

## Customizing the reaction picker
It's possible to customize the emoji picker to display the emojis you want. You can configure it in the "Reactions" settings menu.

## About reacting to remote posts
Because reactions are a Misskey-original feature, unless the remote instance is also a Misskey instance, reactions to posts will be sent as a "Like" activity.Generally speaking, "Like" functionality seems to be implemented as a "Favorite" feature. In addition, even if the interaction partner is a Misskey instance, custom emoji reactions will not be transmitted and instead fall back to a "👍" reaction or similar.

## About reactions from remote servers
If a "Like" activity is sent from a remote server, it will be interpreted as a "👍" reaction in Misskey.

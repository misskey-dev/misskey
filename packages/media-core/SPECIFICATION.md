# Misskeyメディアプロキシ仕様書

本体メディアプロキシ・外部メディアプロキシはいずれも、このパッケージ (`@misskey-dev/media-core`) の実装を使用する。

## メディアプロキシの種類と目的
Misskeyメディアプロキシは、リモートのファイルをインスタンス管理者が管理するドメインでプロキシ配信し、また、縮小・加工された画像を提供するためのアプリケーションである。

Misskeyサーバー本体の/proxy/で提供されている「本体メディアプロキシ (local media proxy)」と、[github.com/misskey-dev/media-proxy](https://github.com/misskey-dev/media-proxy)で配布されている「外部メディアプロキシ (external media proxy)」がある。

外部メディアプロキシを設定・使用することで、本体のサーバー負荷を軽減できる。また、複数のインスタンスで外部プロキシを共用すると、さらなる負荷軽減が期待できる。

## 外部メディアプロキシの設定と使用
外部メディアプロキシを設定するには、[misskey-dev/media-proxy](https://github.com/misskey-dev/media-proxy)のREADME.mdに記載されている通りインストールする。

外部メディアプロキシが設定されている場合、本体メディアプロキシは外部メディアプロキシへ301リダイレクトを返答する（originクエリが指定されている場合を除く）。

Misskeyサーバーのapi/metaの応答に、使用するべきメディアプロキシのURLを示す`mediaProxy`プロパティが存在する。  
外部メディアプロキシが指定されているならそのURLが、指定されていなければ本体メディアプロキシ(/proxy/)のURLが入っている。  
本体メディアプロキシはリダイレクトを行うものの、Misskeyクライアントは`mediaProxy`の値に応じて適切なメディアプロキシへ直接要求を行うべきである。

メディアプロキシへは、クエリ文字列によって命令を行う。

拡張子によってキャッシュの挙動を変えるCDNがあるため、image.webp、avatar.webp、static.webpなどの適当なファイル名を付加するべきである。  
例:  
`https://example.com/proxy/image.webp?url=https%3A%2F%2F......`

Acceptヘッダーは無視される。  
User-Agentヘッダーが無い場合はHTTPコード400が、User-Agentに`misskey/`が含まれる場合（プロキシの再帰）は403が返される。  
Cache-Controlは、正常なレスポンスの場合`max-age=31536000, immutable`、エラーレスポンスの場合`max-age=300`である。  
Content-Typeは、ファイルの内容について適切なものが挿入される。
Content-Security-Policyは、`default-src 'none'; img-src 'self'; media-src 'self'; style-src 'unsafe-inline'`となっている。
Content-Dispositionは、filenameは元画像のContent-Disposition.filenameもしくはファイル名に基づいて挿入される。拡張子は適宜変更され、octet-streamの場合は拡張子として.unknownが付加される。inlineが指定される。

### クエリの一覧
#### url (必須)
変換ないしはプロキシを行う対象の、元画像のURLを指定する。  
指定がなかった場合はHTTPコード400が返される。

https://www.google.com/images/errors/robot.png をプロキシする場合:  
`https://example.com/proxy/image.webp?url=https%3A%2F%2Fwww.google.com%2Fimages%2Ferrors%2Frobot.png`

#### origin (本体のみ)
存在すると、外部メディアプロキシへのリダイレクトを行わない。

`https://example.com/proxy/image.webp?url=https%3A%2F%2F...&origin=1`

「存在すると」というのは、Fastifyで`'origin' in request.query`がtureになる場合という意味である。以下同様。

#### fallback
存在すると、元画像に到達できなかったり画像の変換中にエラーが起きたりした場合、正常なレスポンス（Cache-Controlは`max-age=300`）としてフォールバック画像（カラーバー）が表示される。

#### 変換クエリが存在しない場合の挙動
次の項目からは変換形式を指定するクエリとなっている。

変換形式が指定されていなかった場合は、画像ファイルかつ許可されたファイル（FILE_TYPE_BROWSERSAFE）である場合のみプロキシ（ファイルの再配信）が行われる。それ以外の場合は403が返される。  
ただし、svgは、webpに変換される（最大サイズ2048x2048）。

#### 変換クエリ付加時の挙動
一方、以下の変換クエリが指定されているが、元ファイルがsharp.jsで変換できない形式の場合、404が返される。

#### emoji
存在すると、高さ128px以下のwebpが応答される。  
ただし、sharp.jsの都合により、元画像がapngの場合は無変換で応答される。

`https://example.com/proxy/emoji.webp?url=https%3A%2F%2F...&emoji=1`

「以下」というのは、元画像がこれ未満だった場合は拡大を行わないという意味である。以下同様。

#### avatar
存在すると、高さ320px以下のwebpが応答される。  
ただし、sharp.jsの都合により、元画像がapngの場合は無変換で応答される。

`https://example.com/proxy/avatar.webp?url=https%3A%2F%2F...&avatar=1`

#### static
存在すると、アニメーション画像では最初のフレームのみの静止画のwebpが応答される。

emojiまたはavatarとstaticが同時に指定された場合は、それぞれに応じた高さが、指定されていない場合は幅498px・高さ422pxに収まるサイズ以下に縮小される。

#### preview
存在すると、幅200px・高さ200pxに収まるサイズ以下のwebpが応答される。

#### badge
Webプッシュ通知のバッジに適したpngが応答される。

https://developer.mozilla.org/ja/docs/Web/API/Notification/badge

サイズは96x96で、元画像がアルファチャンネルのみで表現される。

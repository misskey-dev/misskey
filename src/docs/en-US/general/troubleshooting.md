# Troubleshooting
<div class="info">ℹ️ Please also use the <a href="./faq">Frequently asked questions</a>.</div>

If you run into a problem, please check this page first. In the case that you can't find your problem here, or the steps described here don't solve your issue, please contact your server's administrator or [Report it as a bug](./report-issue).

## The client does not start
ほとんどの場合、お使いのブラウザまたはOSのバージョンが古いことが原因です。 ブラウザおよびOSのバージョンを最新のものに更新してから、再度試してみてください。

これは稀ですが、それでも起動しない場合は、キャッシュが原因の場合があります。ブラウザのキャッシュをクリアして、再度試してみてください。

## A page cannot be loaded
クライアントが起動するもののページが読み込めないというエラーが出る場合は、ネットワークに問題がないか確認してください。また、サーバーがダウンしていないか確認してください。

これは稀ですが、キャッシュが原因の場合があります。ブラウザのキャッシュをクリアして、再度試してみてください。

まだ問題がある場合は、サーバーの問題と思われるのでサーバーの管理者に連絡してください。

## The client is slow
以下を試してみてください:

- クライアント設定で「UIのアニメーションを減らす」を有効にする
- クライアント設定で「モーダルにぼかし効果を使用」を無効にする
- お使いのブラウザの設定でハードウェアアクセラレーションを有効にする
- お使いのデバイスのスペックを上げる

## Parts of the UI are weird (For example, the background is transparent)
アップデートによりUIの改修が行われたときに、テーマのキャッシュシステムの影響でそのような表示になることがあります。 クライアントの設定の「キャッシュをクリア」すると直ります。
<div class="warn">⚠️ 「クライアントの」キャッシュクリアです。「ブラウザの」キャッシュクリアは行わないでください。</div>

## The blinking light of a notification or Antenna won't go away
点滅は、未読のコンテンツがあることを示しています。通常点滅が消えない場合は、コンテンツを遡ると未読なコンテンツが残っています。 すべて既読にしたと思われるのに、それでもなお点滅が続く場合(おそらく不具合と思われます)は設定から強制的にすべて既読扱いにすることができます。

## Renoting is not possible
フォロワー限定のノートはRenoteすることはできません。

## Specific parts of the UI are not being displayed
広告ブロッカーを使用しているとそのような不具合が発生することがあります。Misskeyではオフにしてご利用ください。

## Some parts of the UI are untranslated
ほとんどの場合、単に翻訳が間に合っていないだけで、不具合ではありません。翻訳が終わるまでお待ちください。 [翻訳に参加](./misskey)していただくことも可能です。

<<<<<<< HEAD
# Résolution de problèmes
<div class="info">ℹ️ <a href="./faq">よくある質問</a>も合わせてお役立てください。</div>

問題が発生したときは、まずこちらをご確認ください。 該当する項目が無い、もしくは手順を試しても効果がない場合は、サーバーの管理者に連絡するか[不具合を報告](./report-issue)してください。

## クライアントが起動しない
ほとんどの場合、お使いのブラウザまたはOSのバージョンが古いことが原因です。 ブラウザおよびOSのバージョンを最新のものに更新してから、再度試してみてください。

これは稀ですが、それでも起動しない場合は、キャッシュが原因の場合があります。ブラウザのキャッシュをクリアして、再度試してみてください。

## ページが読み込めない
クライアントが起動するもののページが読み込めないというエラーが出る場合は、ネットワークに問題がないか確認してください。また、サーバーがダウンしていないか確認してください。

これは稀ですが、キャッシュが原因の場合があります。ブラウザのキャッシュをクリアして、再度試してみてください。

まだ問題がある場合は、サーバーの問題と思われるのでサーバーの管理者に連絡してください。

## クライアントの動作が遅い
=======
# Résolution des problèmes
<div class="info">ℹ️ N'hésitez pas à consulter les <a href="./faq">Questions fréquentes</a> en complément de cette page.</div>

Lorsque vous rencontrez un problème, nous vous prions de lire cette page tout d'abord. Si toutefois aucun des paragraphes ci-dessous ne correspond à votre problème, ou bien si vous n'arrivez pas à le résoudre en suivant les instructions détaillées ici, nous vous invitons à contacter l'administrateur·rice de votre instance ou à [Signaler un bug](./report-issue).

## Le client ne démarre pas
Généralement, ce problème est dû au fait que vous utilisez une version trop ancienne de votre navigateur ou de votre système d'exploitation. Effectuez les mises à jour pour chacun d'eux vers leurs versions les plus récentes, puis essayez à nouveau.

Cela arrive rarement, mais si votre client ne démarre toujours pas après cela, le problème vient du cache. Dans ce cas, videz le cache et essayez à nouveau.

## La page ne charge pas
Si votre client démarre mais qu'un message d'erreur apparaît lors du chargement de la page, assurez-vous qu'il ne s'agit pas d'un problème de connexion au réseau. Assurez-vous également que votre serveur n'est pas temporairement inaccessible.

Bien que cela arrive rarement, il se peut que le cache soit à l'origine du problème. Dans ce cas, videz le cache et essayez à nouveau.

Si le problème persiste malgré tout, il est très probable qu'il s'agisse d'une panne côté serveur ; nous vous invitons donc à contacter l'administrateur·rice de votre instance.

## Le client est lent
>>>>>>> f84483896edeb1f8655175b77d35ecd49f6e1985
以下を試してみてください:

- クライアント設定で「UIのアニメーションを減らす」を有効にする
- クライアント設定で「モーダルにぼかし効果を使用」を無効にする
- お使いのブラウザの設定でハードウェアアクセラレーションを有効にする
- お使いのデバイスのスペックを上げる

## UIの一部の表示がおかしい(背景が透明になっている等)
アップデートによりUIの改修が行われたときに、テーマのキャッシュシステムの影響でそのような表示になることがあります。 クライアントの設定の「キャッシュをクリア」すると直ります。
<div class="warn">⚠️ 「クライアントの」キャッシュクリアです。「ブラウザの」キャッシュクリアは行わないでください。</div>

## 通知やアンテナ等の点滅が消えない
点滅は、未読のコンテンツがあることを示しています。通常点滅が消えない場合は、コンテンツを遡ると未読なコンテンツが残っています。 すべて既読にしたと思われるのに、それでもなお点滅が続く場合(おそらく不具合と思われます)は設定から強制的にすべて既読扱いにすることができます。

<<<<<<< HEAD
## Renoteができない
フォロワー限定のノートはRenoteすることはできません。

## UI上で特定の要素が表示されない
広告ブロッカーを使用しているとそのような不具合が発生することがあります。Misskeyではオフにしてご利用ください。

## UI上で未翻訳の部分がある
ほとんどの場合、単に翻訳が間に合っていないだけで、不具合ではありません。翻訳が終わるまでお待ちください。 [翻訳に参加](./misskey)していただくことも可能です。
=======
## La fonction « Renoter » ne fonctionne pas
Les notes dont l'audience est limitée aux « Abonné·e·s uniquement » ne peuvent pas être renotées.

## Des éléments spécifiques de l'interface ne s'affichent pas
広告ブロッカーを使用しているとそのような不具合が発生することがあります。Misskeyではオフにしてご利用ください。

## Certaines parties de l'interface ne sont pas traduites
La plupart du temps, cela n'est pas un bug mais simplement un problème de traduction qui n'a pas encore été faite. Merci de patienter jusqu'à ce que la traduction de la portion en question soit achevée. Vous pouvez également [aider à traduire](./misskey) Misskey.
>>>>>>> f84483896edeb1f8655175b77d35ecd49f6e1985

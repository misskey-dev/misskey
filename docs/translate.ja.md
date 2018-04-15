Misskeyの翻訳
============

新たな言語を追加するには
----------------------
/locales 内に既にある何らかの言語ファイルをコピーして、追加したい言語名にリネームして編集してください。

Misskey内の未翻訳箇所を見つけたら
-------------------------------

1. Misskeyのソースコード内から未翻訳箇所を探してください。
	- 例えば`src/client/app/mobile/views/pages/home.vue`で未翻訳箇所を見つけたとします。

2. 未翻訳箇所を`%i18n:@hoge%`のような形式の文字列に置換してください。
	- `hoge`は実際にはその場に適したわかりやすい(英語の)名前にしてください。
	- 例えば未翻訳箇所が「タイムライン」というテキストだった場合、`%i18n:@timeline%`のようにします。

3. /locales 内にあるそれぞれの言語ファイルを開き、1.で見つけた<strong>ファイル名(パス)</strong>のキーが存在するか確認し、無ければ作成してください。
	- パスの`src/client/app/`は省略してください。
	- 例えば、今回の例では`src/client/app/mobile/views/pages/home.vue`の未翻訳箇所を修正したいので、キーは`mobile/views/pages/home.vue`になります。

4. そのキーの直下に2.で置換した`hoge`の部分をキーとし、翻訳後のテキストを値とするプロパティを追加します。
	- 例えば、今回の例で言うと`locales/ja.yml`に`timeline: "タイムライン"`、`locales/en.yml`に`timeline: "Timeline"`を追加します。

5. 完了です！

詳しくは、[このコミット](https://github.com/syuilo/misskey/commit/10f6d5980fa7692ccb45fbc5f843458b69b7607c)などを参考にしてください。

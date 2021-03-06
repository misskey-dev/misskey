# Motywy

Możesz zmienić wygląd klienta Misskey, ustawiając motyw.

## Ustawienia motywu
Ustawienia > Motywy

## Tworzenie motywu
Kod motywów jest zapisywany jako obiekt JSON5 z opcjami motywu. Motywy składają się z następujących opcji.
``` js
{
    id: '17587283-dd92-4a2c-a22c-be0637c9e22a',

    name: 'Danboard',
    author: 'syuilo',

    base: 'light',

    props: {
        accent: 'rgb(218, 141, 49)',
        bg: 'rgb(218, 212, 190)',
        fg: 'rgb(115, 108, 92)',
        panel: 'rgb(236, 232, 220)',
        renote: 'rgb(100, 152, 106)',
        link: 'rgb(100, 152, 106)',
        mention: '@accent',
        hashtag: 'rgb(100, 152, 106)',
        header: 'rgba(239, 227, 213, 0.75)',
        navBg: 'rgb(216, 206, 182)',
        inputBorder: 'rgba(0, 0, 0, 0.1)',
    },
}

```

* `id` ... Unikatowe ID motywu.Zalecane jest użycie UUID.
* `name` ... Nazwa motywu
* `author` ... Twórca motywu
* `desc` ... Opis motywu (nieobowiązkowy)
* `base` ... Określa, czy motyw jest oparty na jasnym, czy ciemnym motywie
    * `light`にすると明るいテーマになり、`dark`にすると暗いテーマになります。
    * Motyw będzie dziedziczył domyślne wartości określonego tu motywu.
* `props` ... Definicje stylów motywu.これから説明します。

### Definicje stylów motywu.
`props`下にはテーマのスタイルを定義します。 キーがCSSの変数名になり、バリューで中身を指定します。 なお、この`props`オブジェクトはベーステーマから継承されます。 ベーステーマは、このテーマの`base`が`light`なら[_light.json5](https://github.com/syuilo/misskey/blob/develop/src/client/themes/_light.json5)で、`dark`なら[_dark.json5](https://github.com/syuilo/misskey/blob/develop/src/client/themes/_dark.json5)です。 つまり、このテーマ内の`props`に`panel`というキーが無くても、そこにはベーステーマの`panel`があると見なされます。

#### Składnia wartości
* Kolory Hex
    * Np.: `#00ff00`
* Kolory RGB w składni `rgb(r, g, b)`
    * Np.: `rgb(0, 255, 0)`
* Kolory RGBA w składni `rgb(r, g, b)`
    * Np.: `rgba(0, 255, 0, 0.5)`
* Nawiązania do wartości innych kluczy
    * `@{キー名}`と書くと他のキーの値の参照になります。`{キー名}`は参照したいキーの名前に置き換えます。
    * 例: `@panel`
* 定数(後述)の参照
    * `${定数名}`と書くと定数の参照になります。`{定数名}`は参照したい定数の名前に置き換えます。
    * 例: `$main`
* 関数(後述)
    * `:{関数名}<{引数}<{色}`

#### Stała
「CSS変数として出力はしたくないが、他のCSS変数の値として使いまわしたい」値があるときは、定数を使うと便利です。 キー名を`$`で始めると、そのキーはCSS変数として出力されません。

#### Funkcje
wip

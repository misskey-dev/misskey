# Tema

Puoi utilizzare i temi per cambiare l'aspetto del client Misskey.

## Impostazioni tema
Impostazioni > Tema

## Creare un tema
Il codice dei temi è scritto a forma di oggetti JSON5. I temi contengono gli oggetti sotto citati:
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

* `id` ... Identificativo univoco del tema. È consigliato utilizzare un UUID.
* `name` ... Nome tema
* `author` ... Autore/Autrice del tema
* `desc` ... Descrizione tema (facoltativa)
* `base` ... Imposta tema chiaro o tema scuro
    * Scegli `light` per impostare un tema chiaro, e `dark` per impostare un tema scuro.
    * Il tema erediterà dalle caratteristiche del tema di base impostato qui.
* `props` ... Imposta uno stile di tema. (Vedi spiegazioni sotto.)

### Impostare uno stile di tema
`props`下にはテーマのスタイルを定義します。 キーがCSSの変数名になり、バリューで中身を指定します。 なお、この`props`オブジェクトはベーステーマから継承されます。 ベーステーマは、このテーマの`base`が`light`なら[_light.json5](https://github.com/misskey-dev/misskey/blob/develop/src/client/themes/_light.json5)で、`dark`なら[_dark.json5](https://github.com/misskey-dev/misskey/blob/develop/src/client/themes/_dark.json5)です。 つまり、このテーマ内の`props`に`panel`というキーが無くても、そこにはベーステーマの`panel`があると見なされます。

#### Sintassi dei valori
* Colori HEX
    * Es.: `#00ff00`
* Colori `RGB(r, g, b)`
    * Es.: `rgb(0, 255, 0)`
* Colori `RGBA(r, g, b, a)`
    * Es.: `rgba(0, 255, 0, 0.5)`
* 他のキーの値の参照
    * `@{キー名}`と書くと他のキーの値の参照になります。`{キー名}`は参照したいキーの名前に置き換えます。
    * Es.: `@panel`
* Costanti (vedi sotto)
    * `${定数名}`と書くと定数の参照になります。`{定数名}`は参照したい定数の名前に置き換えます。
    * Es.: `$main`
* Funzioni (vedi sotto)
    * `:{functionname}<{argument}<{color}`

#### Costanti
「CSS変数として出力はしたくないが、他のCSS変数の値として使いまわしたい」値があるときは、定数を使うと便利です。 キー名を`$`で始めると、そのキーはCSS変数として出力されません。

#### Funzioni
wip

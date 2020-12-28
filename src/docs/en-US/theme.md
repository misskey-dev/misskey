# Themes

You can change the appearance of the Misskey client by setting a theme.

## Theme settings
Settings > Themes

## Creating a theme
Theme codes are saved as a JSON5 object of theme options. Themes are composed of the following options.
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

* `id` ... A unique theme ID.Using an UUID is recommended.
* `name` ... The name of the theme
* `author` ... The creator of the theme
* `desc` ... A description of the theme (optional)
* `base` ... Whether the theme is based on a light or dark theme
    * If you set it to `light` the theme will be listed as a light mode theme, if you set it to `dark` it will be listed as a dark mode theme.
    * The theme will be inheriting the default values of the theme specified here.
* `props` ... The style definitions of the theme.These will be explained in the following.

### Theme style definitions
`props`下にはテーマのスタイルを定義します。 キーがCSSの変数名になり、バリューで中身を指定します。 なお、この`props`オブジェクトはベーステーマから継承されます。 ベーステーマは、このテーマの`base`が`light`なら[_light.json5](https://github.com/syuilo/misskey/blob/develop/src/client/themes/_light.json5)で、`dark`なら[_dark.json5](https://github.com/syuilo/misskey/blob/develop/src/client/themes/_dark.json5)です。 つまり、このテーマ内の`props`に`panel`というキーが無くても、そこにはベーステーマの`panel`があると見なされます。

#### Syntax for values
* Hex colors
    * E.g.: `#00ff00`
* RGB colors with `rgb(r, g, b)` syntax
    * E.g.: `rgb(0, 255, 0)`
* RGBA colors with `rgb(r, g, b)` syntax
    * E.g.: `rgba(0, 255, 0, 0.5)`
* References to values of other keys
    * If you write `@{key-name}` the value of the given key will be used.Replace `{key-name}` with the name of the key to reference.
    * E.g.: `@panel`
* Constants (see below)
    * If you write `${constant-name}` the value of the given constant will be used.Replace `{constant-name}` with the name of the constant to reference.
    * E.g.: `$main`
* Functions (see below)
    * `:{function-name}<{argument}<{color}`

#### Constants
In cases where you have a value that you don't want to output as a CSS variable, but want to use it as the value of another CSS variable, you can use a constant. If you prefix the name of a key with a `$`, it will be not be used as a CSS variable, but a referenced value.

#### Functions
wip

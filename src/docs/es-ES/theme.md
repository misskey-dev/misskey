# Tema

Eligiendo un tema, se puede cambiar la apariencia del cliente de Misskey

## Configuración del tema
Configuración > Tema

## Crear tema
El código del tema se guarda como un archivo JSON5. Un ejemplo de tema se puede ver aquí:
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

* `id` ... Clave única del tema.Se recomienda un código UUID
* `name` ... Nombre del tema
* `author` ... Autor del tema
* `desc` ... Descripción del tema (opcional)
* `base` ... Si es un tema claro u oscuro
    * Si se elige `light`, será un tema claro. Si se elige `dark`, será un tema oscuro.
    * Aquí el tema hereda los valores por defecto del tema base elegido
* `props` ... Definición del estilo del tema. Esto se explica en lo siguiente.

### Definición del estilo del tema
Debajo de `props`, se define el estilo del tema. La clave es el nombre de las variables del CSS, y con los valores estos se configuran. Incluso más, este objeto `props` hereda los valores por defecto del tema base. El tema base es [_light.json5](https://github.com/misskey-dev/misskey/blob/develop/src/client/themes/_light.json5) si el `base` de este tema es `light`, y [_dark.json5](https://github.com/misskey-dev/misskey/blob/develop/src/client/themes/_dark.json5) si si el `base` de este tema es `dark` Resumiendo, aunque no haya una clave `panel` en el `props` del tema, se considera el <0>panel</0> del tema base.

#### Sintaxis de las variables
* Los colores en base hexadecimal
    * Ej: `#00ff00`
* Los colores con la sintaxis `rgb(r, g, b)`
    * Ej: `rgb(0, 255, 0)`
* Los colores con la sintaxis `rgb(r, g, b, a)` con un grado de transparencia
    * Ej: `rgba(0, 255, 0, 0.5)`
* Referencias a valores de otras claves
    * Escribiendo `@{nombre de clave}` se hace referencia al valor de la otra clave.Reemplace `{nombre de clave}` por el nombre de la clave al cual quiera hacer referencia.
    * Ej: `@panel`
* Referencia a una constante (ver más abajo)
    * `${定数名}`と書くと定数の参照になります。`{定数名}`は参照したい定数の名前に置き換えます。
    * 例: `$main`
* 関数(後述)
    * `:{関数名}<{引数}<{色}`

#### Constante
「CSS変数として出力はしたくないが、他のCSS変数の値として使いまわしたい」値があるときは、定数を使うと便利です。 キー名を`$`で始めると、そのキーはCSS変数として出力されません。

#### funciones
wip

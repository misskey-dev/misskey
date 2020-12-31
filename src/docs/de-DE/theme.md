# Farbthemen

Durch die Verwendung von Farbthemen kann das Aussehen des Misskey-Clients verändert werden.

## Themeneinstellungen
Einstellungen > Farbthemen

## Erstellung eines Themas
Themencodes werden im Format eines JSON5-Objekts gespeichert. Themen werden wie das folgende Objekt dargestellt:
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

* `id` ... Die einzigartige Identifikation des Themas.Verwendung von UUIDs ist empfohlen.
* `name` ... Name des Themas
* `author` ... Ersteller des Themas
* `desc` ... Beschreibung des Themas (optional)
* `base` ... Ob dies ein Thema für den Hell- oder Dunkelmodus ist
    * Wird `light` angegeben, so wird es als Thema des Hellmodus angezeigt, wird `dark` angegeben, so wird es als Thema des Dunkelmodus angezeigt.
    * Das Thema erbt die Eigenschaften der hier eingestellten Vorlage.
* `props` ... Definitionen der Themenoptionen.Diese werden im folgenden erläutert.

### Definition von Themenoptionen
Die Optionen des Themas werden in `props` definiert. Die Schlüssel werden zu CSS-Variablen, die Werte geben den Inhalt an. Zusätzlich werden die `props` des gewählten Basisthemas von diesem Thema geerbt. Ist die `base` dieses Themas auf `light` gesetzt, so werden sie aus [_light.json5](https://github.com/syuilo/misskey/blob/develop/src/client/themes/_light.json5) kopiert, ist sie auf `dark` gesetzt, so werden sie aus [_dark.json5](https://github.com/syuilo/misskey/blob/develop/src/client/themes/_dark.json5) kopiert. Beispielsweise wird, falls sich in den `props` dieses Themas keine Definition für den Schlüssel `panel` befindet, so wird der Wert von `panel` aus dem Basisthema verwendet.

#### Syntax für Wertangaben
* Hexadezimalfarben
    * z.B.: `#00ff00`
* RGB-Farben mit `rgb(r, g, b)`-Syntax
    * z.B.: `rgb(0, 255, 0)`
* RGBA-Farben mit `rgb(r, g, b, a)`-Syntax
    * z.B.: `rgba(0, 255, 0, 0.5)`
* Werte anderer Schlüssel referenzieren
    * Durch das angeben von `@{Schlüsselname}` wird dies durch eine Referenz auf den Wert des gegebenen Schlüssels ersetzt.Ersetze `{Schlüsselname}` mit dem Namen des Schlüssels, der referenziert werden soll.
    * z.B.: `@panel`
* Konstantenreferenz (später erläutert)
    * Durch das angeben von `${Konstantenname}` wird dies durch eine Referenz auf den Wert der angegebenen Konstante ersetzt.Ersetze `{Konstantenname}` durch den Namen der Konstanten, die referenziert werden soll.
    * z.B.: `$main`
* Funktionen (später erläutert)
    * `:{Funktionsname}<{Parameter}<{Farbe}`

#### Konstante
「CSS変数として出力はしたくないが、他のCSS変数の値として使いまわしたい」値があるときは、定数を使うと便利です。 キー名を`$`で始めると、そのキーはCSS変数として出力されません。

#### Funktionen
wip

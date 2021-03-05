# Thème

Vous pouvez modifier l'apparence de votre client Misskey à l'aide de thèmes.

## Paramètres de thème
Paramètres > Thèmes

## Créer un thème
Les codes des thèmes sont écrits sous forme d'objets JSON5. Les thèmes comprennent les objets suivants :
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

* `id` ... L'identifiant unique du thème. L'utilisation d'un UUID est recommandée ;
* `name` ... Nom du thème ;
* `author` ... Auteur du thème ;
* `desc` ... Description du thème (facultatif) ;
* `base` ... Thème clair ou sombre :
    * Sélectionnez `light` pour définir le thème comme thème clair et `dark` pour le définir comme sombre,
    * Le thème héritera des valeurs par défaut du thème spécifié ici ;
* `props` ... Définir un style de thème.Voir les explications ci-après.

### Définir un style de thème
C'est dans `props` que vous définirez le style de thème. Les propriétés deviendront des variables CSS et les valeurs spécifieront le contenu. Par ailleurs, les objets présents par défaut dans `props` sont hérités du thème de base. Ainsi, si le thème de `base` est clair `light` ce sera l'objet [_light.json5](https://github.com/syuilo/misskey/blob/develop/src/client/themes/_light.json5) ; et s'il est sombre `dark` ce sera l'objet [_dark.json5](https://github.com/syuilo/misskey/blob/develop/src/client/themes/_dark.json5). Cela signifie, par exemple, que s'il n'y pas de propriété `panel` définie dans les `props` du thème, alors ce sera la valeur `panel` du thème de base qui sera prise en compte.

#### Syntaxe des valeurs
* Codes de couleur Hex
    * Ex. : `#00ff00`
* Couleurs avec les valeurs RVB : `rgb(r, g, b)`
    * Ex. : `rgb(0, 255, 0)`
* Couleurs avec les valeurs RVBA : `rgba(r, g, b, a)`
    * Ex. : `rgba(0, 255, 0, 0.5)`
* Faire référence aux valeurs d'autres propriétés
    * Entrer `@{keyname}` pour utiliser la valeur de la propriété citée. Remplacer alors `{keyname}` par le nom de la propriété que vous souhaitez citer.
    * Ex. : `@panel`
* Constantes (voir ci-dessous)
    * Entrer `${constantname}` pour utiliser la valeur de la constante citée.Remplacer alors `{constantname}` par la nom de la constante que vous souhaitez citer.
    * Ex. : `$main`
* Fonctions (voir ci-dessous)
    * `:{functionname}<{argument}<{color}`

#### Constantes
Dans le cas où vous ne souhaiteriez pas qu'une valeur génère une variable CSS mais que vous voudriez l'utiliser comme valeur pour une autre variable CSS, vous avez la possibilité d'utiliser une constante. Il suffit de faire précéder le nom de la propriété de : `$` pour que celle-ci ne génère pas de variable CSS.

#### Fonctions
wip

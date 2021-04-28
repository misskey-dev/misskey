# Développement du bot Reversi de Misskey
Cette page explique comment développer un bot pour la fonction Reversi de Misskey.

1. Connectez-vous au flux `games/reversi` avec les paramètres suivants :
    * `i` : Clé API pour le compte du bot

2. Lorsqu'une invitation à un jeu arrive, un événement `invited` sera lancé à partir du flux.
    * Le contenu de cet événement est un attribut `parent`, qui contient des informations sur l'utilisateur qui a envoyé l'invitation.

3. Envoie une requête à `games/reversi/match`, où la valeur du paramètre `user_id` est l'attribut `id` de l'objet `parent` obtenu précédemment.

4. Si la requête fonctionne, les informations sur le jeu seront renvoyées et vous pourrez vous connecter au flux `games/reversi-game` avec les paramètres suivants :
    * `i` : Clé API pour le compte du bot
    * `game`: `game` de `id`

5. Pendant ce temps, l'adversaire peut modifier les paramètres du jeu. Chaque fois qu'un paramètre est modifié, le flux envoie un événement `update-settings`, donc une logique pour gérer ces événements peut être nécessaire.

6. Une fois que vous êtes satisfait des paramètres du jeu, envoyez le message `{ type : 'accept' }` au flux.

7. Lorsque le jeu commence, l'événement `started` sera envoyé.
    * Les informations sur l'état du jeu seront inclus dans cet événement.

8. Pour placer une pierre, envoyez `{ type : 'set', pos : <Position&gt ; }` au flux (voir ci-dessous pour savoir comment calculer la position).

9. Lorsque votre adversaire ou vous-même placer une pierre, un événement `set` est envoyé depuis le flux.
    * `color` contient la couleur de la pierre placée
    * `pos` contient la position de la pierre

## Calculer la position
Si nous considérons une carte 8x8, la position de chaque carré (appelée index) est la suivante :
```
+--+--+--+--+--+--+--+--+
| 0| 1| 2| 3| 4| 5| 6| 7|
+--+--+--+--+--+--+--+--+
| 8| 9|10|11|12|13|14|15|
+--+--+--+--+--+--+--+--+
|16|17|18|19|20|21|22|23|
...
```

### Trouver les index à partir des coordonnées X, Y
```
pos = x + (y * mapWidth)
```
`mapWidth` est une donnée de la carte prise sur la `map` comme suit :
```
mapWidth = map[0].length
```

### Trouver les coordonnées X, Y depuis l'index
```
x = pos % mapWidth
y = Math.floor(pos / mapWidth)
```

## Information sur la carte
Les données de la carte sont incluses dans `map` dans les données du jeu. Comme les données sont représentées sous la forme d'un tableau de chaînes de caractères, chaque caractère représente un champ. Sur la base de ces données, vous pouvez reconstruire l'état de la carte :
* `(Vide)` ... Aucun champ
* `-` ... Champ
* `b` ... La première pierre placée est noire
* `w` ... La première pierre placée est blanche

Par exemple, supposons que nous ayons la carte simple suivante de 4×4 :
```text
+---+---+---+---+
|   |   |   |   |
+---+---+---+---+
|   | ○ | ● |   |
+---+---+---+---+
|   | ● | ○ |   |
+---+---+---+---+
|   |   |   |   |
+---+---+---+---+
```

Dans ce cas, les données de la carte ressembleront à ceci :
```javascript
['----', '-wb-', '-bw-', '----']
```

## Créer un Bot interactif en présentant un formulaire à l'utilisateur.
Afin de communiquer avec l'utilisateur, un formulaire peut être présenté à l'utilisateur sur l'écran des paramètres du jeu. Par exemple, un scénario pourrait consister à permettre à l'utilisateur de définir la force du bot.

Pour présenter le formulaire, envoyez le message suivant au flux `reversi-game` :
```javascript
{
  type: 'init-form',
  body: [Tableau de contrôles de formulaires]
}
```

Nous allons maintenant expliquer le tableau des contrôles de formulaires. Un contrôle de formulaire est un objet qui ressemble à ce qui suit :
```javascript
{
  id: 'switch1',
  type: 'switch',
  label: 'Enable hoge',
  value: false
}
```
`id` ... ID de l'élément de contrôle. `type` ... Le type d'élément de contrôle. Nous y reviendrons plus tard.  Texte affiché à côté de l'élément de contrôle. `value` ... La valeur par défaut de l'élément de contrôle.

### Gestion des interactions avec les formulaires
Lorsqu'un utilisateur interagit avec le formulaire, un événement `update-form` est envoyé par le flux. Le contenu de l'événement contient l'ID du contrôle et la valeur définie par l'utilisateur. Par exemple, si l'utilisateur allume l'interrupteur illustré ci-dessus, l'événement suivant sera diffusé :
```javascript
{
  id: 'switch1',
  value: true
}
```

### Types d'éléments de contrôles de formulaires
#### Interrupteur
type: `switch` Affiche un interrupteur.Cette fonction est utile lorsque vous souhaitez activer ou désactiver une fonction.

##### Propriétés
`label` ... Texte à marquer sur l'interrupteur.

#### Boutons radio
type: `radio` Affiche le bouton radio.Il est utile pour proposer des options.Par exemple, pour choisir la difficulté du bot.

##### Propriétés
`items` ... Les options des boutons radio. Par exemple:
```javascript
items: [{
  label: 'Facile',
  value: 1
}, {
  label: 'Moyen',
  value: 2
}, {
  label: 'Difficile',
  value: 3
}]
```

#### Glissière
type: `slider` Affiche une glissière.

##### Propriétés
`min` ... Limite minimum de la glissière. `max` ... Limite maximum de la glissière. `step` ... 入力欄で刻むステップ値。

#### テキストボックス
type: `textbox` テキストボックスを表示します。ユーザーになにか入力させる一般的な用途に利用できます。

## ユーザーにメッセージを表示する
設定画面でユーザーと対話する、フォーム以外のもうひとつの方法がこれです。ユーザーになにかメッセージを表示することができます。 例えば、ユーザーがBotの対応していないモードやマップを選択したとき、警告を表示するなどです。 メッセージを表示するには、次のメッセージをストリームに送信します:
```javascript
{
  type: 'message',
  body: {
    text: 'contenu du message',
    type: 'Type du message'
  }
}
```
Type de message : `success`, `info`, `warning`, `error`.

## Abandonner
Pour se rendre, faites une demande à <a href="./api/endpoints/games/reversi/games/surrender">cette terminaison</a>.

# API streaming

L'API Streaming permet d'implémenter l'exécution d'opérations variées et la réception de diverses informations en temps réel. Cela concerne, par exemple, l'affichage des nouvelles publications dans les fils, la réception de nouveaux messages, les nouveaux abonnements, etc.

## ストリームに接続する

ストリーミングAPIを利用するには、まずMisskeyサーバーに**websocket**接続する必要があります。

以下のURLに、`i`というパラメータ名で認証情報を含めて、websocket接続してください。Par exemple:
```
%WS_URL%/streaming?i=xxxxxxxxxxxxxxx
```

認証情報は、自分のAPIキーや、アプリケーションからストリームに接続する際はユーザーのアクセストークンのことを指します。

<div class="ui info">
    <p><i class="fas fa-info-circle"></i> 認証情報の取得については、<a href="./api">こちらのドキュメント</a>をご確認ください。</p>
</div>

---

認証情報は省略することもできますが、その場合非ログインでの利用ということになり、受信できる情報や可能な操作は限られます。Par exemple:

```
%WS_URL%/streaming
```

---

ストリームに接続すると、後述するAPI操作や、投稿の購読を行ったりすることができます。 しかしまだこの段階では、例えばタイムラインへの新しい投稿を受信したりすることはできません。 それを行うには、ストリーム上で、後述する**チャンネル**に接続する必要があります。

**ストリームでのやり取りはすべてJSONです。**

## Canaux
L'API de streaming de Misskey possède le concept de canaux.Il s'agit d'un mécanisme permettant de séparer les informations que vous envoyez et recevez. Si vous vous connectez simplement à un flux Misskey, vous ne pourrez pas encore recevoir les messages de votre timeline en temps réel. En vous connectant aux canaux du flux, vous pourrez recevoir diverses informations et en envoyer.

### Se connecter à un canal
Pour se connecter à un canal, envoyez les données suivantes au flux en JSON :

```json
{
    type: 'connect',
    body: {
        channel: 'xxxxxxxx',
        id: 'foobar',
        params: {
            ...
        }
    }
}
```

Ici,
* Définissez `channel` au nom du canal auquel vous voulez vous connecter.Les types de canaux sont décrits ci-dessous.
* `id` est un identifiant arbitraire pour interagir avec ce canal.En effet, le flux contient une variété de messages, et nous devons identifier de quel canal provient le message.Cet ID peut être un UUID ou une sorte de numéro aléatoire.
* `params` sont les paramètres utilisés pour se connecter au canal.Les différents canaux nécessitent des paramètres différents pour la connexion.Lors de la connexion à un canal qui ne nécessite pas de paramètres, cette propriété peut être omise.

<div class="ui info">
    <p><i class="fas fa-info-circle"></i> L'ID est "par connexion de canal", et non par canal. En effet, dans certains cas, plusieurs connexions sont établies sur le même canal avec des paramètres différents.</p>
</div>

### Recevoir des messages du canal
Par exemple, lorsqu'un événement est émis dans l'un des canaux du fil en raison de la publication d'un nouveau message.En recevant ce message, vous saurez en temps réel qu'une nouvelle publication a été faite sur votre fil.

Lorsqu'un canal émet un message, les données suivantes sont diffusées en JSON :
```json
{
    type: 'channel',
    body: {
        id: 'foobar',
        type: 'something',
        body: {
            some: 'thing'
        }
    }
}
```

Ici,
* `id` est réglé sur l'ID que vous avez défini lors de la connexion à ce canal comme décrit ci-dessus.Cela vous permettra de savoir de quel canal provient ce message.
* `type` est défini comme le type du message.Le type de message qui sera diffusé dépend du canal.
* `body` est défini comme le contenu du message.En fonction du canal, le type de message qui sera diffusé dépendra du canal.

### Envoi d'un message à un canal
Selon le canal, il se peut que vous ne receviez pas seulement des messages, mais que vous puissiez également envoyer certains messages et effectuer certaines opérations.

Pour envoyer un message à un canal, envoyez les données suivantes au flux en JSON :
```json
{
    type: 'channel',
    body: {
        id: 'foobar',
        type: 'something',
        body: {
            some: 'thing'
        }
    }
}
```

Ici,
* `id` doit être réglé sur l'ID que vous avez défini lors de la connexion à ce canal comme décrit ci-dessus.Cela vous permettra d'identifier le canal auquel ce message est destiné.
* `type` définit le type du message.Les différents canaux acceptent différents types de messages.
* `body` est défini comme le contenu du message.Les différents canaux acceptent différents types de messages.

### Déconnexion d'un canal
Pour se déconnecter d'un canal, envoyez les données suivantes au flux en JSON :

```json
{
    type: 'disconnect',
    body: {
        id: 'foobar'
    }
}
```

Ici,
* `id` doit être réglé sur l'ID que vous avez défini lors de la connexion à ce canal comme décrit ci-dessus.

## Faire une requête API via le flux

Si vous effectuez une requête d'API via un flux, vous pouvez utiliser l'API sans générer de requête HTTP.Cela peut rendre votre code plus concis et améliorer les performances.

Pour effectuer une demande d'API via un flux, envoyez les données suivantes au flux en JSON :
```json
{
    type: 'api',
    body: {
        id: 'xxxxxxxxxxxxxxxx',
        endpoint: 'notes/create',
        data: {
            text: 'yee haw!'
        }
    }
}
```

Ici,
* `id` doit être défini comme un identifiant unique pour chaque demande d'API afin d'identifier la réponse de l'API.Il peut s'agir de quelque chose comme un UUID ou un simple nombre aléatoire.
* `endpoint` est le point de terminaison de l'API que vous voulez demander.
* `data` contient les paramètres de la terminaison.

<div class="ui info">
    <p><i class="fas fa-info-circle"></i> Veuillez vous reporter à la référence de l'API pour les points de terminaison et les paramètres de l'API.</p>
</div>

### Réception des réponses

Lorsque vous faites une demande à l'API, la réponse viendra du flux dans le format suivant.

```json
{
    type: 'api:xxxxxxxxxxxxxxxx',
    body: {
        ...
    }
}
```

Ici,
* La partie `xxxxxxxxxxxxxxxx` contient le `id` qui a été défini au moment de la demande.Cela vous permet de déterminer à quelle demande il répond.
* `body` contient la réponse.

## Capture de message

Misskey propose un mécanisme appelé post-capture.Il s'agit de la possibilité de recevoir un flux d'événements pour un message donné.

Par exemple, supposons une situation dans laquelle le fil est affichée pour un utilisateur.Supposons maintenant que quelqu'un réagisse à l'un des messages de ce fil.

Cependant, comme le client n'a aucun moyen de savoir qu'un message a reçu une réaction, il n'est pas possible de refléter la réaction en temps réel sur le message dans le fil.

Pour résoudre ce problème, Misskey fournit un mécanisme de post-capture.Lorsque vous capturez un message, vous recevez des événements liés à ce message, ce qui vous permet de refléter les réactions en temps réel.

### Capturer un message

Pour capturer un message, envoyez un message comme le suivant au flux :

```json
{
    type: 'subNote',
    body: {
        id: 'xxxxxxxxxxxxxxxx'
    }
}
```

Ici,
* Définissez `id` comme l'`id` du message que vous voulez capturer.

Lorsque vous envoyez ce message, vous demandez à Misskey de le saisir, et les événements liés à ce message se succéderont à partir de ce moment-là.

Par exemple, lorsqu'un message suscite une réaction, vous verrez apparaître un message du type suivant :

```json
{
    type: 'noteUpdated',
    body: {
        id: 'xxxxxxxxxxxxxxxx',
        type: 'reacted',
        body: {
            reaction: 'like',
            userId: 'yyyyyyyyyyyyyyyy'
        }
    }
}
```

Ici,
* Le `id` dans le `body` est défini comme l'ID du post qui a déclenché l'événement.
* Le type de l'événement est défini par `type` dans `body`.
* L'attribut `body` dans `body` contient les informations sur l'événement.

#### Type d'événements

##### `reacted`
Cela se produit lorsqu'une réaction est faite à ce message.

* `reaction` est défini comme le type de réaction.
* `userId` sera défini comme l'ID de l'utilisateur qui a fait la réaction.

Par exemple:
```json
{
    type: 'noteUpdated',
    body: {
        id: 'xxxxxxxxxxxxxxxx',
        type: 'reacted',
        body: {
            reaction: 'like',
            userId: 'yyyyyyyyyyyyyyyy'
        }
    }
}
```

##### `deleted`
Cela se produit lorsque ce message est supprimé.

* `deletedAt` est défini comme la date et l'heure de la suppression.

Par exemple:
```json
{
    type: 'noteUpdated',
    body: {
        id: 'xxxxxxxxxxxxxxxx',
        type: 'deleted',
        body: {
            deletedAt: '2018-10-22T02:17:09.703Z'
        }
    }
}
```

##### `pollVoted`
Déclenché lors du vote sur un sondage dans ce message.

* `choice` contient l'ID du choix sélectionné.
* `userId`に、投票を行ったユーザーのIDが設定されます。

Par exemple:
```json
{
    type: 'noteUpdated',
    body: {
        id: 'xxxxxxxxxxxxxxxx',
        type: 'pollVoted',
        body: {
            choice: 2,
            userId: 'yyyyyyyyyyyyyyyy'
        }
    }
}
```

### 投稿のキャプチャを解除する

その投稿がもう画面に表示されなくなったりして、その投稿に関するイベントをもう受け取る必要がなくなったときは、キャプチャの解除を申請してください。

次のメッセージを送信します:

```json
{
    type: 'unsubNote',
    body: {
        id: 'xxxxxxxxxxxxxxxx'
    }
}
```

Ici,
* `id`にキャプチャを解除したい投稿の`id`を設定します。

このメッセージを送信すると、以後、その投稿に関するイベントは流れてこないようになります。

# Liste des canaux
## `main`
Les informations de base relatives au compte seront transmises ici.Il n'y a pas de paramètres pour ce canal.

### Liste des événements envoyés

#### `renote`
Cet événement est déclenché lorsque votre message est renoté.Cela ne se produit pas lorsque vous renotez votre propre message.

#### `mention`
Il s'agit d'un événement qui se produit lorsque quelqu'un fait vous mentionne.

#### `readAllNotifications`
Cet événement indique que toutes les notifications qui vous ont été adressées ont été lues.Cet événement peut être utilisé pour désactiver des choses comme "l'icône indiquant qu'il y a une notification" et d'autres cas.

#### `meUpdated`
Cet événement indique que vos informations ont été mises à jour.

#### `follow`
Cet événement se produit lorsque vous suivez quelqu'un.

#### `unfollow`
Cet événement se produit lorsque vous retirez quelqu'un de vos suivis.

#### `followed`
Cet événement se produit lorsque vous êtes suivi par quelqu'un.

## `homeTimeline`
Vous verrez ce flux d'informations s'afficher sur votre fil personnel.Il n'y a pas de paramètres pour ce canal.

### Liste des événements envoyés

#### `note`
Cet événement est déclenché lorsqu'un nouveau message arrive sur sur fil.

## `localTimeline`
Vous verrez l'information affichée sur votre fil local.Il n'y a pas de paramètres pour ce canal.

### Liste des événements envoyés

#### `note`
Cet événement est déclenché lorsqu'un nouveau message apparaît dans le fil local.

## `hybridTimeline`
Vous verrez l'information affichée sur le fil social.Il n'y a pas de paramètres pour ce canal.

### Liste des événements envoyés

#### `note`
Cet événement est déclenché lorsqu'un nouveau message apparaît sur votre fil social.

## `globalTimeline`
Vous verrez l'information s'afficher sur le fil global.Il n'y a pas de paramètres pour ce canal.

### Liste des événements envoyés

#### `note`
Cet événement est déclenché lorsqu'un nouveau message arrive sur le fil global.

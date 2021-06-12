# API de Streaming

Usando la API de streaming, se puede recibir en tiempo real toda clase de información (por ejemplo, los posts nuevos que pasaron por la linea de tiempo, los mensajes recibidos, las notificaciones de seguimiento, etc.) y manejar varias operaciones en estas.

## Conectarse a streams

Para usar la API de streaming, primero hay que conectar un **websocket** al servidor de Misskey

Conecte el websocket a la URL mencionada abajo, incluyendo la información de autenticación en el parámetro `i`Ej:
```
%WS_URL%/streaming?i=xxxxxxxxxxxxxxx
```

La información de autenticación hace referencia a tu propia clave de la API, o al token de acceso del usuario cuando se conecta al stream desde la aplicación

<div class="ui info">
    <p><i class="fas fa-info-circle"></i> Para obtener la información de la autenticación, consulte <a href="./api">Este documento</a></p>
</div>

---

La información de autenticación puede omitirse, pero en ese caso de uso sin un login, se restringirá la información que puede ser recibida y las operaciones posibles,Ej:

```
%WS_URL%/streaming
```

---

Al conectarse al stream, se pueden ejecutar las operaciones de la API mencionadas abajo y la suscripción de posts. Sin embargo en esta fase, todavía no es posible recibir los posts nuevos llegando a la linea de tiempo. Para hacer eso, es necesario conectarse a los **canales** mencionados más abajo.

**Todos los envíos y recibimientos de información con el stream son JSONs**

## Canales
En la API de streaming de Misskey, hay un concepto llamado "canal". Es una estructura para separar la información enviada y recibida. Solo con conectarse al stream de Misskey, aún no es posible recibir los posts de la linea de tiempo en tiempo real. Al conectarse al canal en el stream, se puede enviar y recibir variada información relacionada a los canales.

### Conectarse a canales
Para conectarse a los canales, hay que enviar al stream en formato JSON los siguientes datos.

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

Aquí
* En `channel` ingrese el nombre del canal al que quiere conectarse. Más abajo se menciona una lista de canales.
* En `id` ingrese un ID al azar para el intercambio de información con aquel canal. Como en el stream pasan varios mensajes, es necesario identificar de qué canales son esos mensajes. Este ID puede ser un UUID o un número al azar.
* `params` son los parámetros para conectarse al canal. Los parámetros requeridos al momento de conectarse varían según el canal. Si se conecta a un canal que no requiere parámetros, esta propiedad puede omitirse.

<div class="ui info">
    <p><i class="fas fa-info-circle"></i> El ID no es por canal sino "por conexión al canal". Porque hay casos en que se pueden hacer múltiples conexiones con parámetros distintos al mismo canal. </p>
</div>

### Recibir mensajes del canal
Por ejemplo, cuando hay nuevos posts en el canal, envía un mensaje. Al recibir ese mensaje, se puede conocer en tiempo real que hay nuevos posts en la linea de tiempo.

Cuando el canal envía un mensaje, se envía al stream en formato JSON los siguientes datos.
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

Aquí
* En `id` se incluye el ID usado para conectarse al canal mencionado más arriba. Con esto se puede conocer a qué canales pertenecen los mensajes.
* En `type` se incluye el tipo del mensaje. Dependiendo del canal, varía qué tipo de mensajes pasan.
* En `body` se incluye el contenido del mensaje. Dependiendo del canal, varía qué contenido de mensajes pasan.

### Enviar mensajes al canal
Dependiendo del canal, se puede no solo recibir mensajes, sino también mandar mensajes a dicho canal, y realizar algunas operaciones.

Para mandar un mensaje al canal, se envía al stream en formato JSON los siguientes datos.
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

Aquí
* En `id` ingrese el ID usado para conectarse al canal mencionado más arriba. Con esto se puede identificar a qué canales fueron dirigidos los mensajes.
* En `type` ingrese el tipo del mensaje. Dependiendo del canal, varía qué tipo de mensajes serán aceptados.
* En `body` ingrese el contenido del mensaje. Dependiendo del canal, varía qué contenidos de mensajes serán aceptados.

### Desconectarse del canal
Para desconectarse de un canal, se envía al stream en formato JSON los siguientes datos.

```json
{
    type: 'disconnect',
    body: {
        id: 'foobar'
    }
}
```

Aquí
* En `id` ingrese el ID usado para conectarse al canal mencionado más arriba.

## Hacer pedidos a la API a través del stream

Al hacer pedidos a la API a través del stream, se puede usar la API sin que se genere un pedido HTTP. Para eso, probablemente se pueda hacer el código más conciso y mejorar el rendimiento.

Para hacer pedidos a la API a través del stream, se envía al stream en formato JSON los siguientes datos.
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

Aquí
* En `id` se requiere ingresar un ID único por cada pedido a la API, para distinguir las respuestas de la API. Puede ser un UUID o un número aleatorio.
* En `endpoint` ingrese el endpoint de la API a la que quiere hacer el pedido.
* En `data` incluya los parámetros del endpoint 

<div class="ui info">
    <p><i class="fas fa-info-circle"></i> En cuanto a los endpoint de la API y los parámetros, consulte las referencias de la API.</p>
</div>

### Recibiendo respuestas

Al hacer un pedido a la API, llegará desde el stream una respuesta en el siguiente formato.

```json
{
    type: 'api:xxxxxxxxxxxxxxxx',
    body: {
        ...
    }
}
```

Aquí
* En la porción que dice `xxxxxxxxxxxxxxxx` viene el `id` ingresado en el momento de hacer el pedido. Con esto, se puede distinguir a qué pedido corresponde la respuesta.
* En `body` vienen los datos de la respuesta.

## Capturar posts

Misskey ofrece una construcción llamada "captura de posts". Es una función para recibir en el stream los eventos de un post seleccionado.

例えばタイムラインを取得してユーザーに表示したとします。ここで誰かがそのタイムラインに含まれるどれかの投稿に対してリアクションしたとします。

しかし、クライアントからするとある投稿にリアクションが付いたことなどは知る由がないため、リアルタイムでリアクションをタイムライン上の投稿に反映して表示するといったことができません。

この問題を解決するために、Misskeyは投稿のキャプチャ機構を用意しています。投稿をキャプチャすると、その投稿に関するイベントを受け取ることができるため、リアルタイムでリアクションを反映させたりすることが可能になります。

### 投稿をキャプチャする

投稿をキャプチャするには、ストリームに次のようなメッセージを送信します:

```json
{
    type: 'subNote',
    body: {
        id: 'xxxxxxxxxxxxxxxx'
    }
}
```

Aquí
* `id`にキャプチャしたい投稿の`id`を設定します。

このメッセージを送信すると、Misskeyにキャプチャを要請したことになり、以後、その投稿に関するイベントが流れてくるようになります。

例えば投稿にリアクションが付いたとすると、次のようなメッセージが流れてきます:

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

Aquí
* `body`内の`id`に、イベントを発生させた投稿のIDが設定されます。
* `body`内の`type`に、イベントの種類が設定されます。
* `body`内の`body`に、イベントの詳細が設定されます。

#### イベントの種類

##### `reacted`
その投稿にリアクションがされた時に発生します。

* `reaction`に、リアクションの種類が設定されます。
* `userId`に、リアクションを行ったユーザーのIDが設定されます。

Ej:
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
その投稿が削除された時に発生します。

* `deletedAt`に、削除日時が設定されます。

Ej:
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
その投稿に添付されたアンケートに投票された時に発生します。

* `choice`に、選択肢IDが設定されます。
* `userId`に、投票を行ったユーザーのIDが設定されます。

Ej:
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

Aquí
* `id`にキャプチャを解除したい投稿の`id`を設定します。

このメッセージを送信すると、以後、その投稿に関するイベントは流れてこないようになります。

# チャンネル一覧
## `main`
アカウントに関する基本的な情報が流れてきます。このチャンネルにパラメータはありません。

### 流れてくるイベント一覧

#### `renote`
自分の投稿がRenoteされた時に発生するイベントです。自分自身の投稿をRenoteしたときは発生しません。

#### `mention`
誰かからメンションされたときに発生するイベントです。

#### `readAllNotifications`
自分宛ての通知がすべて既読になったことを表すイベントです。このイベントを利用して、「通知があることを示すアイコン」のようなものをオフにしたりする等のケースが想定されます。

#### `meUpdated`
自分の情報が更新されたことを表すイベントです。

#### `follow`
自分が誰かをフォローしたときに発生するイベントです。

#### `unfollow`
自分が誰かのフォローを解除したときに発生するイベントです。

#### `followed`
自分が誰かにフォローされたときに発生するイベントです。

## `homeTimeline`
ホームタイムラインの投稿情報が流れてきます。このチャンネルにパラメータはありません。

### 流れてくるイベント一覧

#### `note`
タイムラインに新しい投稿が流れてきたときに発生するイベントです。

## `localTimeline`
ローカルタイムラインの投稿情報が流れてきます。このチャンネルにパラメータはありません。

### 流れてくるイベント一覧

#### `note`
ローカルタイムラインに新しい投稿が流れてきたときに発生するイベントです。

## `hybridTimeline`
ソーシャルタイムラインの投稿情報が流れてきます。このチャンネルにパラメータはありません。

### 流れてくるイベント一覧

#### `note`
ソーシャルタイムラインに新しい投稿が流れてきたときに発生するイベントです。

## `globalTimeline`
グローバルタイムラインの投稿情報が流れてきます。このチャンネルにパラメータはありません。

### 流れてくるイベント一覧

#### `note`
グローバルタイムラインに新しい投稿が流れてきたときに発生するイベントです。

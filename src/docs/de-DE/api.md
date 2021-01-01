# Misskey API

Durch die Verwendung des Misskey APIs können Misskey Clients, mit Misskey kompatible Web-Services, Bots (ab sofort "Anwendungen" genannt) und mehr entwickelt werden. Ebenso existiert ein Streaming-API, um Echtzeit-Anwendungen zu erstellen.

Um mit der Verwendung des APIs zu beginnen, wird zuerst ein Zugriffstoken benötigt. Wie ein solcher Token erhalten werden kann, und wie die API dann hiermit verwendet werden kann, wird auf dieser Seite erklärt.

## Einen Zugriffstoken erhalten
Generell benötigen alle API-Anfragen einen Zugriffstoken. Die Methode, wie ein solcher Zugriffstoken erlangt werden kann, unterscheidet sich je nach dem, ob Anfragen vom eigenen Benutzerkonto aus gesendet werden oder ob die Anfragen von einem anderen Benutzer aus durch eine Anwendung gesendet werden.

* Im ersten Fall: Fahre mit "Einen Zugriffstoken für das eigene Benutzerkonto generieren" fort.
* Im zweiten Fall: Fahre mit "Einen Benutzer zur Generierung eines Zugangstokens für eine Anwendung auffordern" fort.

### Einen Zugriffstoken für das eigene Benutzerkonto generieren
In Einstellungen > API kann ein Zugriffstoken für das eigene Benutzerkonto generiert werden.

[Fahre mit "Verwendung der API" fort.](#APIの使い方)

### Einen Benutzer zur Generierung eines Zugangstokens für eine Anwendung auffordern
Um einen in einer Anwendung zu verwendenden Zugriffstoken für ein Benutzerkonto zu erhalten, fordere die Generierung eines solchen durch den unten beschrieben Prozess an.

#### Schritt 1

Generiere eine UUID.Diese werden wir ab jetzt die Sitzungs-ID nennen.

> Die selbe Sitzungs-ID sollte nie mehrfach wieder verwendet werden, generiere anstattdessen für jeden Zugriffstoken eine neue Sitzungs-ID.

#### Schritt 2

Öffne `{_URL_}/miauth/{session}` im Browser des Benutzers.`{session}` soll hierbei durch die vorher generierte Sitzungs-ID ersetzt werden.
> z.B.: `{_URL_}/miauth/c1f6d42b-468b-4fd2-8274-e58abdedef6f`

Bei Aufruf dieser URL können verschiedene Einstellungen via Query-Parameter gesetzt werden:
* `name` ... Anwendungsname
    * > z.B.: `MissDeck`
* `icon` ... URL zum Anwendungs-Icon
    * > z.B.: `https://missdeck.example.com/icon.png`
* `callback` ... URL, zu der nach Ende der Authentifizierung weitergeleitet wird
    * > z.B.: `https://missdeck.example.com/callback`
    * In dieser Weiterleitung wird die Sessions-ID als `session` Query-Parameter an die URL angefügt
* `permission` ... Von der Anwendung geforderte Berechtigungen
    * > z.B.: `write:notes,write:following,read:drive`
    * Angeforderte Berechtigungen sind durch `,` von einander getrennt
    * Welche Berechtigungen existieren kann in der [API-Referenz](/api-doc) nachgelesen werden

#### Schritt 3
Sobald der Benutzer der Erstellung des Zugriffstokens zugestimmt hat, kann durch eine POST-Anfrage an `{_URL_}/api/miauth/{session}/check` der Zugriffstoken aus dem JSON-Objekt der Antwort ausgelesen werden.

In der Antwort enthaltene Attribute:
* `token` ... Zugriffstoken des Nutzers
* `user` ... Benutzerdaten

[Fahre mit "Verwendung der API" fort.](#APIの使い方)

## Verwendung der API
**Alle API-Anfragen sind POST-Anfragen, und alle Anfragen bzw. Antworten sind JSON-Objekte.REST wird nicht unterstützt.** Der Zugriffstoken muss unter dem `i`-Parameter beinhaltet werden.

* [API-Referenz](/api-doc)
* [Streaming-API](./stream)

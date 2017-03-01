Misskey
================================

[![][travis-badge]][travis-link]
[![][dependencies-badge]][dependencies-link]
[![][himawari-badge]][himasaku]
[![][sakurako-badge]][himasaku]
[![][mit-badge]][mit]

Welcome!

[Misskey](https://misskey.xyz) is a completely open source,
ultimately sophisticated new type of mini-blog based SNS.

![ss](./resources/ss.jpg)

Key features
--------------------------------
* Automatically updated timeline
* Private messages
* Free 1GB storage
* Mobile device support (smartphone, tablet, etc)
* Web API for Third-party applications
* Twitter integration

and more! You can touch with your own eyes at https://misskey.xyz/.

Setup
--------------------------------
### Dependencies :package:
Please install these softwares.
* *Node.js* and *npm*
* **[MongoDB](https://www.mongodb.com/)**
* **[Redis](https://redis.io/)**
* **[GraphicsMagick](http://www.graphicsmagick.org/)**

#### Optional
* [Elasticsearch](https://www.elastic.co/) - used to provide searching feature instead of MongoDB

### Domains
Misskey requires two domains called the primary domain and the secondary domain.

* The primary domain is used to provide main service of Misskey.
* The secondary domain is used to avoid vulnerabilities such as XSS.

**Ensure that the secondary domain is not a subdomain of the primary domain.**

#### Subdomains
Note that Misskey uses following subdomains:

* **api**.*{primary domain}*
* **auth**.*{primary domain}*
* **about**.*{primary domain}*
* **dev**.*{primary domain}*
* **file**.*{secondary domain}*

### reCAPTCHA tokens
Please visit https://www.google.com/recaptcha/intro/ and generate keys.

Setup with Docker :whale:
--------------------------------
Ensure that the working directory is the repository root directory.

To create misskey image:

`sudo docker build -t misskey ./docker`

To run misskey:

`sudo docker run --rm -i -t -p $PORT:80 -v $(pwd):/root/misskey -v $DBPATH:/data/db misskey`

where `$PORT` is the port used to access Misskey Web from host browser
and `$DBPATH` is the path of MongoDB database on the host for data persistence.

ex: `sudo docker run --rm -i -t -p 80:80 -v $(pwd):/root/misskey -v /data/db:/data/db misskey`

If you want to run misskey in production mode, add `--env NODE_ENV=production` like this:

`sudo docker run --rm -i -t -p 80:80 -v $(pwd):/root/misskey -v /data/db:/data/db --env NODE_ENV=production misskey`

Note that `$(pwd)` is the working directory.

Install
--------------------------------
### Using built code
1. `git clone -b release git://github.com/syuilo/misskey.git`
2. `cd misskey`
3. `npm install`

#### Update
1. `git fetch`
2. `git reset --hard origin/release`
3. `npm install`

### Using source code
1. `git clone -b master git://github.com/syuilo/misskey.git`
2. `cd misskey`
3. `npm install`
4. `npm run build`

#### Update
1. `git pull origin master`
2. `npm install`
3. `npm run build`

Launch
--------------------------------
`sudo npm start`

GLHF!

Testing
--------------------------------
Run `npm test` after building

Debugging :bug:
--------------------------------
### Show debug messages
Misskey uses [debug](https://github.com/visionmedia/debug) and the namespace is `misskey:*`.

Contribute
--------------------------------
Do you have feature request or problem with Misskey?
Please create issue to report it if it is about the Misskey implementation itself.

Currently Misskey is missing documents so writing documents would be appreciated.
Pull requests are always welcome.

*We love contributions from anybody.*

[Contribution guide](./CONTRIBUTING.md)

### TODO
* More [tests](./test)!
* More [docs](./docs)!
* More sophisticated code!

Collaborators
------------------------------
| ![syuilo][syuilo-icon] | ![Morisawa Aya][ayamorisawa-icon] | ![otofune][otofune-icon]        |
|------------------------|-----------------------------------|---------------------------------|
| [syuilo][syuilo-link]  | [Aya Morisawa][ayamorisawa-link]  | [Otoha Funabashi][otofune-link] |

Copyright
------------------------------
Misskey is an open-source software licensed under [The MIT License](LICENSE).

[mit]:                http://opensource.org/licenses/MIT
[mit-badge]:          https://img.shields.io/badge/license-MIT-444444.svg?style=flat-square
[travis-link]:        https://travis-ci.org/syuilo/misskey
[travis-badge]:       http://img.shields.io/travis/syuilo/misskey/master.svg?style=flat-square
[dependencies-link]:  https://gemnasium.com/syuilo/misskey
[dependencies-badge]: https://img.shields.io/gemnasium/syuilo/misskey.svg?style=flat-square
[himasaku]:           https://himasaku.net
[himawari-badge]:     https://img.shields.io/badge/%E5%8F%A4%E8%B0%B7-%E5%90%91%E6%97%A5%E8%91%B5-1684c5.svg?style=flat-square
[sakurako-badge]:     https://img.shields.io/badge/%E5%A4%A7%E5%AE%A4-%E6%AB%BB%E5%AD%90-efb02a.svg?style=flat-square

<!-- Collaborators Info -->
[syuilo-link]:      https://syuilo.com
[syuilo-icon]:      https://avatars2.githubusercontent.com/u/4439005?v=3&s=70
[ayamorisawa-link]: https://github.com/ayamorisawa
[ayamorisawa-icon]: https://avatars0.githubusercontent.com/u/10798641?v=3&s=70
[otofune-link]:     https://github.com/otofune
[otofune-icon]:     https://avatars0.githubusercontent.com/u/15062473?v=3&s=70

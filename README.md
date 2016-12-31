# Misskey
[![][travis-badge]][travis-link]
[![][appveyor-badge]][appveyor-link]
[![][dependencies-badge]][dependencies-link]
[![][mit-badge]][mit]

Welcome!

Misskey is a completely open source, ultimately sophisticated new type of mini-blog based SNS.

![ss](./resources/ss.jpg)

## Features
* Automatically updated timeline
* Private chatting (messaging)
* Free 1GB storage
* Mobile device support (smartphone, tablet, etc)
* Thirdparty application support

and more!

## Building
1. Install *git*, *Node.js* and *npm*
2. `git clone git://github.com/syuilo/misskey.git`
3. `cd misskey`
4. `npm install`
5. `npm run config`
6. `npm run build`

## Test
`npm test`

## Setup
### Dependencies :package:
Please install these softwares.
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

### reCAPTCHA
Please visit https://www.google.com/recaptcha/intro/ and generate keys.

## Setup with Docker :whale:
Ensure that the working directory is the repository root directory.

To create misskey image:
`sudo docker build -t misskey ./docker`

To run misskey:
`sudo docker run --rm -i -t -p $PORT:80 -v $(pwd):/root/misskey -v $DBPATH:/data/db misskey`

where $PORT is the port used to access Misskey Web from host browser
and $DBPATH is the path of MongoDB database on the host for data persistence.

ex: `sudo docker run --rm -i -t -p 80:80 -v $(pwd):/root/misskey -v /data/db:/data/db misskey`

Note that $(pwd) is the working directory.

## Launch
`sudo npm start`

## Contribute
Do you have feature request or problem with Misskey?
Please create issue to report it.

Currently Misskey is missing documents so writing documents would be appreciated.
Pull requests are always welcome.

We love contributions from anybody.

[Contribution guide](./CONTRIBUTING.md)

### TODO
* More [tests](./test)!
* More [docs](./docs)!
* More cleaning up code!

## License
[The MIT License](LICENSE)

[mit]:                http://opensource.org/licenses/MIT
[mit-badge]:          https://img.shields.io/badge/license-MIT-444444.svg?style=flat-square
[travis-link]:        https://travis-ci.org/syuilo/misskey
[travis-badge]:       http://img.shields.io/travis/syuilo/misskey.svg?style=flat-square&label=Linux
[appveyor-link]:      https://ci.appveyor.com/project/syuilo/misskey
[appveyor-badge]:     https://img.shields.io/appveyor/ci/syuilo/misskey/master.svg?style=flat-square&label=Windows
[dependencies-link]:  https://gemnasium.com/syuilo/misskey
[dependencies-badge]: https://img.shields.io/gemnasium/syuilo/misskey.svg?style=flat-square

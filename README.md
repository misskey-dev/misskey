# Misskey

[![][travis-badge]][travis-link]
[![][appveyor-badge]][appveyor-link]
[![][dependencies-badge]][dependencies-link]
[![][mit-badge]][mit]

A miniblog-based SNS.

![ss](./resources/ss.jpg)

## Build
1. Install git, Node.js and npm
2. `git clone git://github.com/syuilo/misskey.git`
3. `cd misskey`
4. `npm install`
5. `npm run config`
6. `npm run build`

## Test
`npm test`

## Setup
### Dependencies
Please install these softwares.
* MongoDB
* Redis
* GraphicsMagick
* Elasticsearch (optional)

### Domains
Misskey requires two domains called the primary domain and the secondary domain.

* The primary domain is used to provide main service of Misskey.
* The secondary domain is used to avoid vulnerabilities such as XSS.

**Ensure that the secondary domain is not a subdomain of the primary domain.**

### reCAPTCHA
Please visit https://www.google.com/recaptcha/intro/ and generate keys.

## Launch
`sudo npm start`

## Contribute
Do you have feature request or problem with Misskey?
Please create issue to report it.

Currently Misskey is missing documents so writing documents would be appreciated.
Pull requests are always welcome.

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

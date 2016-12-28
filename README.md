# Misskey

[![][travis-badge]][travis-link]
[![][dependencies-badge]][dependencies-link]
[![][mit-badge]][mit]

A miniblog-based SNS.

## Dependencies
* Node.js
* MongoDB
* Redis
* GraphicsMagick

## Optional dependencies
* Elasticsearch

## Get started
Misskey requires two domains called the primary domain and the secondary domain.

* The primary domain is used to provide main service of Misskey.
* The secondary domain is used to avoid vulnerabilities such as XSS.

**Ensure that the secondary domain is not a subdomain of the primary domain.**

## Build
1. `git clone git://github.com/syuilo/misskey.git`
2. `cd misskey`
3. `npm install`
4. `npm run config`
5. `npm run build`

## Launch
`npm start`

## License
[MIT](LICENSE)

[mit]:                http://opensource.org/licenses/MIT
[mit-badge]:          https://img.shields.io/badge/license-MIT-444444.svg?style=flat-square
[travis-link]:        https://travis-ci.org/syuilo/misskey
[travis-badge]:       http://img.shields.io/travis/syuilo/misskey.svg?style=flat-square
[dependencies-link]:  https://gemnasium.com/syuilo/misskey
[dependencies-badge]: https://img.shields.io/gemnasium/syuilo/misskey.svg?style=flat-square

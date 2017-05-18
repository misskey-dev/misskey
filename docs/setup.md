Misskey Setup and Installation Guide
================================================================

This guide describes how to install and setup Misskey.

*1.* Install dependencies
----------------------------------------------------------------

There is **two ways** to install and setup dependencies:

### WAY 1) Setup with Docker :whale:

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

### WAY 2) Setup manually

Please install and setup following dependencies:

#### Dependencies :package:
Please install these softwares.
* *Node.js* and *npm*
* **[MongoDB](https://www.mongodb.com/)**
* **[Redis](https://redis.io/)**
* **[GraphicsMagick](http://www.graphicsmagick.org/)**

##### Optional
* [Elasticsearch](https://www.elastic.co/) - used to provide searching feature instead of MongoDB

*2.* Domains
----------------------------------------------------------------

Misskey requires two domains called the primary domain and the secondary domain.

* The primary domain is used to provide main service of Misskey.
* The secondary domain is used to avoid vulnerabilities such as XSS.

**Ensure that the secondary domain is not a subdomain of the primary domain.**

### Subdomains
Note that Misskey uses following subdomains:

* **api**.*{primary domain}*
* **auth**.*{primary domain}*
* **about**.*{primary domain}*
* **dev**.*{primary domain}*
* **file**.*{secondary domain}*

*3.* reCAPTCHA tokens
----------------------------------------------------------------

Misskey requires reCAPTCHA tokens.
Please visit https://www.google.com/recaptcha/intro/ and generate keys.

*4.* Install Misskey
----------------------------------------------------------------

There is **two ways** to install Misskey:

### WAY 1) Using built code (recommended)
We have official release of Misskey.
The built code is automatically pushed to https://github.com/syuilo/misskey/tree/release after the CI test succeeds.

1. `git clone -b release git://github.com/syuilo/misskey.git`
2. `cd misskey`
3. `npm install`

#### Update
1. `git fetch`
2. `git reset --hard origin/release`
3. `npm install`

### WAY 2) Using source code
If you want to build Misskey manually, you can do it via the
`build` command after download the source code of Misskey and install dependencies:

1. `git clone -b master git://github.com/syuilo/misskey.git`
2. `cd misskey`
3. `npm install`
4. `npm run build`

#### Update
1. `git pull origin master`
2. `npm install`
3. `npm run build`

*5.* That is it.
----------------------------------------------------------------

お疲れ様でした。これでMisskeyを動かす準備は整いました。

### Launch
Just `sudo npm start`. GLHF!

### Testing
Run `npm test` after building

### Debugging :bug:
#### Show debug messages
Misskey uses [debug](https://github.com/visionmedia/debug) and the namespace is `misskey:*`.

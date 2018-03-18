Misskey Setup and Installation Guide
================================================================

We thank you for your interest in setting up your Misskey server!
This guide describes how to install and setup Misskey.

[Japanese version also available - 日本語版もあります](./setup.ja.md)

----------------------------------------------------------------

If you can use Docker, please see [Setup with Docker](./docker.en.md).

*1.* Domains
----------------------------------------------------------------
Misskey requires two domains called the primary domain and the secondary domain.

* The primary-domain is used to provide the main service of Misskey.
* The secondary-domain is used to avoid vulnerabilities such as XSS.

**Ensure that the secondary domain is not a subdomain of the primary domain.**

### Subdomains
Note that Misskey uses following subdomains:

* **api**.*{primary domain}*
* **auth**.*{primary domain}*
* **docs**.*{primary domain}*
* **ch**.*{primary domain}*
* **stats**.*{primary domain}*
* **status**.*{primary domain}*
* **dev**.*{primary domain}*
* **file**.*{secondary domain}*

*2.* reCAPTCHA tokens
----------------------------------------------------------------
Misskey requires reCAPTCHA tokens.
Please visit https://www.google.com/recaptcha/intro/ and generate keys.

*(optional)* Generating VAPID keys
----------------------------------------------------------------
If you want to enable ServiceWroker, you need to generate VAPID keys:

``` shell
npm install web-push -g
web-push generate-vapid-keys
```

*3.* Install dependencies
----------------------------------------------------------------
Please install and setup these softwares:

#### Dependencies :package:
* *Node.js* and *npm*
* **[MongoDB](https://www.mongodb.com/)**
* **[Redis](https://redis.io/)**
* **[ImageMagick](http://www.imagemagick.org/script/index.php)**

##### Optional
* [Elasticsearch](https://www.elastic.co/) - used to provide searching feature instead of MongoDB

*4.* Install Misskey
----------------------------------------------------------------

1. `git clone -b master git://github.com/syuilo/misskey.git`
2. `cd misskey`
3. `npm install`
4. `npm run build`

#### Update
1. `git reset --hard && git pull origin master`
2. `npm install`
3. `npm run build`

*5.* Prepare configuration
----------------------------------------------------------------
First, you need to create a `.config` directory in the directory that
Misskey installed. Then you need to create a `default.yml` file in
the directory. The template of configuration is available [here](./config.md).

*6.* That is it.
----------------------------------------------------------------
Well done! Now, you have an environment that run to Misskey.

### Launch
Just `sudo npm start`. GLHF!

### Testing
Run `npm test` after building

### Debugging :bug:
#### Show debug messages
Misskey uses [debug](https://github.com/visionmedia/debug) and the namespace is `misskey:*`.

Misskey Setup and Installation Guide
================================================================

We thank you for your interest in setting up your Misskey server!
This guide describes how to install and setup Misskey.

[Japanese version also available - 日本語版もあります](./setup.ja.md)

----------------------------------------------------------------

*1.* reCAPTCHA tokens
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

*2.* Install dependencies
----------------------------------------------------------------
Please install and setup these softwares:

#### Dependencies :package:
* *Node.js* and *npm*
* **[MongoDB](https://www.mongodb.com/)**
* **[Redis](https://redis.io/)**
* **[ImageMagick](http://www.imagemagick.org/script/index.php)**

##### Optional
* [Elasticsearch](https://www.elastic.co/) - used to provide searching feature instead of MongoDB

*3.* Install Misskey
----------------------------------------------------------------
1. `git clone -b master git://github.com/syuilo/misskey.git`
2. `cd misskey`
3. `npm install`

*4.* Prepare configuration
----------------------------------------------------------------
1. Copy `example.yml` of `.config` directory
2. Rename it to `default.yml`
3. Edit it

---

Or you can generate config file via `npm run config` command.

*5.* Build Misskey
----------------------------------------------------------------
We need to use `node-gyp` to build the `crypto` module.

1. `npm install -g node-gyp`
2.  `node-gyp configure`
3. `node-gyp build`
4. `npm run build`

*6.* That is it.
----------------------------------------------------------------
Well done! Now, you have an environment that run to Misskey.

### Launch
Just `sudo npm start`. GLHF!

### Way to Update to latest version of your Misskey
1. `git reset --hard && git pull origin master`
2. `npm install`
3. `npm run build`

Misskey Setup and Installation Guide
================================================================

We thank you for your interest in setting up your Misskey server!
This guide describes how to install and setup Misskey.

[Japanese version also available - 日本語版もあります](./setup.ja.md)

----------------------------------------------------------------

*1.* Create Misskey user
----------------------------------------------------------------
Running misskey on root is not a good idea so we create a user for that.
In debian for exemple :

```
adduser --disabled-password --disabled-login misskey
```

*2.* Install dependencies
----------------------------------------------------------------
Please install and setup these softwares:

#### Dependencies :package:
* **[Node.js](https://nodejs.org/en/)**
* **[MongoDB](https://www.mongodb.com/)** >= 3.6

##### Optional
* [Redis](https://redis.io/)
  * Redis is optional, but we strongly recommended to install it
* [Elasticsearch](https://www.elastic.co/) - required to enable the search feature

*3.* Setup MongoDB
----------------------------------------------------------------
In root :
1. `mongo` Go to the mongo shell
2. `use misskey` Use the misskey database
3. `db.users.save( {dummy:"dummy"} )` Write dummy data to initialize the db.
4. `db.createUser( { user: "misskey", pwd: "<password>", roles: [ { role: "readWrite", db: "misskey" } ] } )` Create the misskey user.
5. `exit` You're done !

*4.* Install Misskey
----------------------------------------------------------------
1. `su - misskey` Connect to misskey user.
2. `git clone -b master git://github.com/syuilo/misskey.git` Clone the misskey repo from master branch.
3. `cd misskey` Navigate to misskey directory
4. `git checkout $(git tag -l | grep -v 'rc[0-9]*$' | sort -V | tail -n 1)` Checkout to the [latest release](https://github.com/syuilo/misskey/releases/latest)
5. `npm install` Install misskey dependencies.

*(optional)* reCAPTCHA tokens
----------------------------------------------------------------
If you want to enable reCAPTCHA, you need to generate reCAPTCHA tokens:
Please visit https://www.google.com/recaptcha/intro/ and generate keys.

*(optional)* Generating VAPID keys
----------------------------------------------------------------
If you want to enable ServiceWorker, you need to generate VAPID keys:
Unless you have set your global node_modules location elsewhere, you need to run this in root.

``` shell
npm install web-push -g
web-push generate-vapid-keys
```

*(optional)* Create a twitter application
----------------------------------------------------------------
If you want to enable the twitter integration, you need to create a twitter app at [https://developer.twitter.com/en/apply/user](https://developer.twitter.com/en/apply/user).

In the app you need to set the oauth callback url as : https://misskey-instance/api/tw/cb


*5.* Make configuration file
----------------------------------------------------------------
1. `cp .config/example.yml .config/default.yml` Copy the `.config/example.yml` and rename it to `default.yml`.
2. Edit `default.yml`

*6.* Build Misskey
----------------------------------------------------------------

Build misskey with the following:

`npm run build`

If you're on Debian, you will need to install the `build-essential` package.

If you're still encountering errors about some modules, use node-gyp:

1. `npm install -g node-gyp`
2. `node-gyp configure`
3. `node-gyp build`
4. `npm run build`

*7.* That is it.
----------------------------------------------------------------
Well done! Now, you have an environment that run to Misskey.

### Launch normally
Just `npm start`. GLHF!

### Launch with systemd

1. Create a systemd service here: `/etc/systemd/system/misskey.service`
2. Edit it, and paste this and save:

```
[Unit]
Description=Misskey daemon

[Service]
Type=simple
User=misskey
ExecStart=/usr/bin/npm start
WorkingDirectory=/home/misskey/misskey
TimeoutSec=60
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=misskey
Restart=always

[Install]
WantedBy=multi-user.target
```

3. `systemctl daemon-reload ; systemctl enable misskey` Reload systemd and enable the misskey service.
4. `systemctl start misskey` Start the misskey service.

You can check if the service is running with `systemctl status misskey`.

### Way to Update to latest version of your Misskey
1. `git fetch`
2. `git checkout $(git tag -l | grep -v 'rc[0-9]*$' | sort -V | tail -n 1)`
3. `npm install`
4. `npm run build`
5. Check [ChangeLog](../CHANGELOG.md) for migration information

----------------------------------------------------------------

If you have any questions or troubles, feel free to contact us!

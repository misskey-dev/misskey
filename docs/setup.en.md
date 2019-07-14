Misskey Setup and Installation Guide
================================================================

We thank you for your interest in setting up your Misskey server!
This guide describes how to install and setup Misskey.

[Japanese version also available - 日本語版もあります](./setup.ja.md)

----------------------------------------------------------------

*1.* Create Misskey user
----------------------------------------------------------------
Running misskey as root is not a good idea so we create a user for that.
In debian for exemple :

```
adduser --disabled-password --disabled-login misskey
```

*2.* Install dependencies
----------------------------------------------------------------
Please install and setup these softwares:

#### Dependencies :package:
* **[Node.js](https://nodejs.org/en/)** >= 11.7.0
* **[PostgreSQL](https://www.postgresql.org/)** >= 10
* **[Redis](https://redis.io/)**

##### Optional
* [Elasticsearch](https://www.elastic.co/) - required to enable the search feature
* [FFmpeg](https://www.ffmpeg.org/)

*3.* Install Misskey
----------------------------------------------------------------
1. Connect to misskey user.

	`su - misskey`

2. Clone the misskey repo from master branch.

	`git clone -b master git://github.com/syuilo/misskey.git`

3. Navigate to misskey directory

	`cd misskey`

4. Checkout to the [latest release](https://github.com/syuilo/misskey/releases/latest)

	`git checkout master`

5. Install misskey dependencies.

	`npx yarn install`

*4.* Configure Misskey
----------------------------------------------------------------
1. Copy the `.config/example.yml` and rename it to `default.yml`.

	`cp .config/example.yml .config/default.yml`

2. Edit `default.yml`

*5.* Build Misskey
----------------------------------------------------------------

Build misskey with the following:

`NODE_ENV=production npm run build`

If you're on Debian, you will need to install the `build-essential`, `python` package.

If you're still encountering errors about some modules, use node-gyp:

1. `npm install -g node-gyp`
2. `node-gyp configure`
3. `node-gyp build`
4. `NODE_ENV=production npm run build`

*6.* Init DB
----------------------------------------------------------------
``` shell
npm run init
```

*7.* That is it.
----------------------------------------------------------------
Well done! Now, you have an environment that run to Misskey.

### Launch normally
Just `NODE_ENV=production npm start`. GLHF!

### Launch with systemd

1. Create a systemd service here

	`/etc/systemd/system/misskey.service`

2. Edit it, and paste this and save:

	```
	[Unit]
	Description=Misskey daemon

	[Service]
	Type=simple
	User=misskey
	ExecStart=/usr/bin/npm start
	WorkingDirectory=/home/misskey/misskey
	Environment="NODE_ENV=production"
	TimeoutSec=60
	StandardOutput=syslog
	StandardError=syslog
	SyslogIdentifier=misskey
	Restart=always

	[Install]
	WantedBy=multi-user.target
	```

3. Reload systemd and enable the misskey service.

	`systemctl daemon-reload ; systemctl enable misskey`

4. Start the misskey service.

	`systemctl start misskey`

You can check if the service is running with `systemctl status misskey`.

### How to update your Misskey server to the latest version
1. `git checkout master`
2. `git pull`
3. `npx yarn install` or `yarn install`
4. `NODE_ENV=production npm run build`
5. `npm run migrate`
6. Restart your Misskey process to apply changes
7. Enjoy

If you encounter any problems with updating, please try the following:
1. `npm run clean` or `npm run cleanall`
2. Retry update (Don't forget `npx yarn install` or `yarn install`)

----------------------------------------------------------------

If you have any questions or troubles, feel free to contact us!

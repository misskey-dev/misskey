Docker Guide
================================================================

This guide describes how to install and setup Misskey with Docker.

[Japanese version also available - 日本語版もあります](./docker.ja.md)

----------------------------------------------------------------

*1.* Download Misskey
----------------------------------------------------------------
1. `git clone -b master git://github.com/syuilo/misskey.git` Clone Misskey repository's master branch.
2. `cd misskey` Move to misskey directory.
3. `git checkout $(git tag -l | grep -Ev -- '-(rc|alpha)\.[0-9]+$' | sort -V | tail -n 1)` Checkout to the [latest release](https://github.com/syuilo/misskey/releases/latest) tag.

*2.* Configure Misskey
----------------------------------------------------------------

Create configuration files with following:

```bash
cd .config
cp example.yml default.yml
cp docker_example.env docker.env
```

### `default.yml`

Edit this file the same as non-Docker environment.  
However hostname of Postgresql, Redis and Elasticsearch are not `localhost`, they are set in `docker-compose.yml`.  
The following is default hostname:

| Service       | Hostname |
|---------------|----------|
| Postgresql    | `db`     |
| Redis         | `redis`  |
| Elasticsearch | `es`     |

### `docker.env`

Configure Postgresql in this file.  
The minimum required settings are:

| name                | Description   |
|---------------------|---------------|
| `POSTGRES_PASSWORD` | Password      |
| `POSTGRES_USER`     | Username      |
| `POSTGRES_DB`       | Database name |

*3.* Configure Docker
----------------------------------------------------------------
Edit `docker-compose.yml`.

*4.* Build Misskey
----------------------------------------------------------------
Build misskey with the following:

`docker-compose build`

*5.* Init DB
----------------------------------------------------------------
``` shell
docker-compose run --rm web npm run init
```

*6.* That is it.
----------------------------------------------------------------
Well done! Now you have an environment to run Misskey.

### Launch normally
Just `docker-compose up -d`. GLHF!

### How to update your Misskey server to the latest version
1. `git fetch`
2. `git stash`
3. `git checkout $(git tag -l | grep -Ev -- '-(rc|alpha)\.[0-9]+$' | sort -V | tail -n 1)`
4. `git stash pop`
5. `docker-compose build`
6. Check [ChangeLog](../CHANGELOG.md) for migration information
7. `docker-compose stop && docker-compose up -d`

### How to execute [cli commands](manage.en.md):
`docker-compose run --rm web node cli/mark-admin @example`

----------------------------------------------------------------

If you have any questions or trouble, feel free to contact us!

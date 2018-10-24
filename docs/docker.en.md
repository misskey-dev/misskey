Docker Guide
================================================================

This guide describes how to install and setup Misskey with Docker.

[Japanese version also available - 日本語版もあります](./docker.ja.md)

----------------------------------------------------------------

*1.* Download Misskey
----------------------------------------------------------------
1. `git clone -b master git://github.com/syuilo/misskey.git` Clone Misskey repository's master branch.
2. `cd misskey` Move to misskey directory.
3. `git checkout $(git tag -l | grep -v 'rc[0-9]*$' | sort -V | tail -n 1)` Checkout to the [latest release](https://github.com/syuilo/misskey/releases/latest) tag.

*2.* Make configuration files
----------------------------------------------------------------
1. `cp .config/example.yml .config/default.yml` Copy the `.config/example.yml` and rename it to `default.yml`.
2. `cp .config/mongo_initdb_example.js .config/mongo_initdb.js` Copy the `.config/mongo_initdb_example.js` and rename it to `mongo_initdb.js`.
2. Edit `default.yml` and `mongo_initdb.js`.

*3.* Configure Docker
----------------------------------------------------------------
Edit `docker-compose.yml`.

*4.* Build Misskey
----------------------------------------------------------------
Build misskey with the following:

`docker-compose build`

*5.* That is it.
----------------------------------------------------------------
Well done! Now, you have an environment that run to Misskey.

### Launch normally
Just `docker-compose up -d`. GLHF!

### Way to Update to latest version of your Misskey
1. `git fetch`
2. `git stash`
3. `git checkout $(git tag -l | grep -v 'rc[0-9]*$' | sort -V | tail -n 1)`
4. `git stash pop`
5. `docker-compose build`
6. Check [ChangeLog](../CHANGELOG.md) for migration information
7. `docker-compose stop && docker-compose up -d`

### Way to execute cli command:
`docker-compose run --rm web node cli/mark-admin @example`

----------------------------------------------------------------

If you have any questions or troubles, feel free to contact us!

Docker Guide
================================================================

This guide describes how to install and setup Misskey with Docker.

[Japanese version also available - 日本語版もあります](./docker.ja.md)

----------------------------------------------------------------

*1.* Download Misskey
----------------------------------------------------------------
1. Clone Misskey repository's master branch.

	`git clone -b master git://github.com/syuilo/misskey.git`

2. Move to misskey directory.

	`cd misskey`

3. Checkout to the [latest release](https://github.com/syuilo/misskey/releases/latest) tag.

	```bash
	git tag | grep '^10\.' | sort -V --reverse | \
	while read tag_name; do \
	if ! curl -s "https://api.github.com/repos/syuilo/misskey/releases/tags/$tag_name" \
	| grep -qE '"(draft|prerelease)": true'; \
	then git checkout $tag_name; break; fi ; done
	```

*2.* Configure Misskey
----------------------------------------------------------------
1. `cp .config/example.yml .config/default.yml` Copy the `.config/example.yml` and rename it to `default.yml`.
2. `cp .config/mongo_initdb_example.js .config/mongo_initdb.js` Copy the `.config/mongo_initdb_example.js` and rename it to `mongo_initdb.js`.
3. Edit `default.yml` and `mongo_initdb.js`.

*3.* Configure Docker
----------------------------------------------------------------
Edit `docker-compose.yml`.

*4.* Build Misskey
----------------------------------------------------------------
Build misskey with the following:

`docker-compose build`

*5.* That is it.
----------------------------------------------------------------
Well done! Now you have an environment to run Misskey.

### Launch normally
Just `docker-compose up -d`. GLHF!

### How to update your Misskey server to the latest version
1. `git fetch`
2. `git stash`
3. 

	```bash
	git tag | grep '^10\.' | sort -V --reverse | \
	while read tag_name; do \
	if ! curl -s "https://api.github.com/repos/syuilo/misskey/releases/tags/$tag_name" \
	| grep -qE '"(draft|prerelease)": true'; \
	then git checkout $tag_name; break; fi ; done
	```
4. `git stash pop`
5. `docker-compose build`
6. Check [ChangeLog](../CHANGELOG.md) for migration information
7. `docker-compose stop && docker-compose up -d`

### How to execute [cli commands](manage.en.md):
`docker-compose run --rm web node cli/mark-admin @example`

----------------------------------------------------------------

If you have any questions or trouble, feel free to contact us!

How to backup your Misskey
==========================

In your shell:
``` shell
$ mongodump --archive=db-backup
```

Make sure **mongodb-tools** installed.

Restore
-------

``` shell
$ mongorestore --archive=db-backup
```

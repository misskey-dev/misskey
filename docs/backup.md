How to backup your Misskey
==========================

Make sure **mongodb-tools** installed.

---

In your shell:
``` shell
$ mongodump --archive=db-backup
```

Restore
-------

``` shell
$ mongorestore --archive=db-backup
```

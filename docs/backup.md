How to backup your Misskey
==========================

Make sure **mongodb-tools** installed.

---

In your shell:
``` shell
$ mongodump --archive=db-backup -u <YourUserName> -p <YourPassword>
```

For details, plese see [mongodump docs](https://docs.mongodb.com/manual/reference/program/mongodump/).

Restore
-------

``` shell
$ mongorestore --archive=db-backup
```

For details, please see [mongorestore docs](https://docs.mongodb.com/manual/reference/program/mongorestore/).

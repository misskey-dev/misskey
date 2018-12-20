Comment faire une sauvegarde de votre Misskey ?
==========================

Assurez-vous d'avoir installé **mongodb-tools**.

---

Dans votre terminal :
``` shell
$ mongodump --archive=db-backup -u <VotreNomdUtilisateur> -p <VotreMotDePasse>
```

Pour plus de détails, merci de consulter [la documentation de mongodump](https://docs.mongodb.com/manual/reference/program/mongodump/).

Restauration
-------

``` shell
$ mongorestore --archive=db-backup
```

Pour plus de détails, merci de consulter [la documentation de mongorestore](https://docs.mongodb.com/manual/reference/program/mongorestore/).

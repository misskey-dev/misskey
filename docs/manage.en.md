# Management guide

## Check the status of the job queue
coming soon

## Mark as 'admin' user
``` shell
node built/tools/mark-admin (Username)
```

e.g.
``` shell
node built/tools/mark-admin @syuilo
```
## Activate ServiceWorker
To activate the ServiceWorker, we need to generate a private and a public key.
We can do this on our Server with:
```shell
[Misskey_HOME]/node_modules/.bin/web-push generate-vapid-keys
```
After the generation of the Keys, add them under "Instance" -> "ServiceWorker"

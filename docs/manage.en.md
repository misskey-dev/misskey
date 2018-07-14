# Management guide

## Check the status of the job queue
In the directory of Misskey:
``` shell
node_modules/kue/bin/kue-dashboard -p 3050
```
When you access port 3050, you will see the UI.

## Suspend users
``` shell
node cli/suspend (User-ID)
```

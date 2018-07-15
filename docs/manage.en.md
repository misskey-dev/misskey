# Management guide

## Check the status of the job queue
In the directory of Misskey:
``` shell
node_modules/kue/bin/kue-dashboard -p 3050
```
When you access port 3050, you will see the UI.

## Suspend users
``` shell
node cli/suspend (User-ID or Username)
```
e.g.
``` shell
# Use id
node cli/suspend 57d01a501fdf2d07be417afe

# Use username
node cli/suspend @syuilo

# Use username (remote)
node cli/suspend @syuilo@misskey.xyz
```

## Clean up cached remote files
``` shell
node cli/clean-cached-remote-files
```

# Management guide

## Check the status of the job queue
In the directory of Misskey:
``` shell
node_modules/kue/bin/kue-dashboard -p 3050
```
When you access port 3050, you will see the UI.

## Mark as 'admin' user
``` shell
node cli/mark-admin (User-ID or Username)
```

## Mark as 'verified' user
``` shell
node cli/mark-verified (User-ID or Username)
```

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

## Clean up unused drive files
``` shell
node cli/clean-unused-drive-files
```
> We recommend that you announce a user that unused drive files will be deleted before performing this operation, as it may delete the user's important files.

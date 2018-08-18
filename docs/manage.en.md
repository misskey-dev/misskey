# Management guide

## Check the status of the job queue
coming soon

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

## Reset password
``` shell
node cli/reset-password (User-ID or Username)
```

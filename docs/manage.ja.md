# 運営ガイド

## ジョブキューの状態を調べる
Misskeyのディレクトリで:
``` shell
node_modules/kue/bin/kue-dashboard -p 3050
```
ポート3050にアクセスするとUIが表示されます

## ユーザーを凍結する
``` shell
node cli/suspend (ユーザーID または ユーザー名)
```
例:
``` shell
# ユーザーID
node cli/suspend 57d01a501fdf2d07be417afe

# ユーザー名
node cli/suspend @syuilo

# ユーザー名 (リモート)
node cli/suspend @syuilo@misskey.xyz
```

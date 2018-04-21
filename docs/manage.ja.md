# 運営ガイド

## ジョブキューの状態を調べる
Misskeyのディレクトリで:
``` shell
node_modules/kue/bin/kue-dashboard -p 3050
```
ポート3050にアクセスするとUIが表示されます

## ユーザーを凍結する
``` shell
node cli/suspend (ユーザーID)
```

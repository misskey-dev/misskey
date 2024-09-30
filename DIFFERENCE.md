# DIFFRENCE
## 2024.9.0-yami-1.2.6
### Server
- `notes/show`, `users/notes`の認証を不要に(revert?)
- 状態にかかわらず未ログインユーザーからノートを非表示に(1.2.4の強化)

## 2024.9.0-yami-1.2.5
### Feat
- フォロー解除時にも通知するように

## 2024.8.0-yami-1.2.4
### Feat
- リアクションでミュートを考慮する
### Server
- 連合なしノートを未ログイン状態で閲覧出来ないように

## 2024.8.0-yami-1.2.0
### Feat
* ノートの自動削除(cherry-pick)
* フォローリクエスト自動拒否(cherry-pick)

## 2024.8.0-yami-1.1.0
### Server
* Cherry-Pick リバーシの連合に対応(yojo-art/cherrypick)

## 2024.8.0-yami-1.0.1/1.0.2/1.0.3/1.0.4
### Client
* エントランスからユーザー数/ノート数/チャートを削除

### Server
* ノート/ハイライトの取得に認証を要求
* 絵文字のエクスポートにモデレーター権限を要求
* チャンネル内のTLの取得に認証を要求
* metaからノートの内容を削除

## 2024.7.0-yami_v1.0
### Client
* Cherry-Pick 利用する検索エンジンを選べるようにする(nexryai/nexkey) + SearX Support

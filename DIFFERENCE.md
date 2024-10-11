# DIFFRENCE
## 2024.10.0-yami-1.3.3
## enchance
- user/note/channelの一部metaを削除

## 2024.9.0-yami-1.3.2
## Feat
- ドライブの写真をプロフィールから見れなくする

## 2024.9.0-yami-1.3.1
## Client
- フォロー/フォロワー/アナウンス/みつける/Play/ギャラリー/チャンネル/TL/ユーザー/ノートのページをログイン必須に
- hideReactionUsersをデフォルトで有効に(未ログインユーザーからリアクションしたユーザーを隠せます)

## 2024.9.0-yami-1.3.0
## Feat
- ロールで引用通知の設定を制限出来るように

## 2024.9.0-yami-1.2.9
## Feat
- ノート数を隠せるように(連合しません)

## 2024.9.0-yami-1.2.8
## Feat
- Cherry-Pick アクティビティの非公開機能(hideki0403/kakurega.app)
- Cherry-Pick 誰がリアクションをしたのかを非表示にできる機能を実装(hideki0403/kakurega.app)
- Cherry-Pick リアクション数の非表示機能を実装(hideki0403/kakurega.app)

## 2024.9.0-yami-1.2.7
### enhance
- プライバシーに考慮して、「noCrawle/isExplorable/hideOnline/ffVisibility/フォロリクの自動承認/鍵垢/リアクションの受け入れ」のデフォルト値を変更

## 2024.9.0-yami-1.2.6
### Client
- 状態にかかわらず未ログインユーザーからノートを非表示に(1.2.4の強化)
### Server
- `notes/show`, `users/notes`の認証を不要に(revert?)

## 2024.9.0-yami-1.2.5
### Feat
- フォロー解除時にも通知するように

## 2024.8.0-yami-1.2.4
### Feat
- リアクションでミュートを考慮する
### Client
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

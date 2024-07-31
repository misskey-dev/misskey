# CHANGELOG about VRTL

VRTLのブランチで行われた変更点をまとめています

<!-- VV Please add changelog here VV -->

--- 2024.7.0-vrtl.1 released at this time ---

--- 2024.5.0-vrtl.2 released at this time ---

- chore(backend): VRTL参加サーバーの取得に失敗したときのリトライの間隔を短く
- feat: VRTL/VSTLに連合なし投稿を含めるかを選択可能に
  - もともとのVRTL/VSTLでは連合なし投稿が常に含まれていましたが、正しくVRTL/VSTLのノートを表現するために含めないようにできるようになりました
  - VSTLの場合、連合なし投稿を含めないようにしてもフォローしている人の連合なし投稿は表示されます
- fix(frontend): ウィジェットでVRTL/VSTLが使用できない問題を修正
- fix(backend): 自分自身に対するリプライがwithReplies = falseなVRTL/VSTLにて含まれていない問題を修正
- feat(backend): `vmimiRelayTimelineImplemented` と `disableVmimiRelayTimeline` nodeinfo に追加しました
	- これによりサードパーティクライアントがVRTLの有無を認知できるようになりました。

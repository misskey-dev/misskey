# CHANGELOG about VRTL

VRTLのブランチで行われた変更点をまとめています

<!-- VV Please add changelog here VV -->
- fix(frontend): ウィジェットでVRTL/VSTLが使用できない問題を修正
- fix(backend): 自分自身に対するリプライがwithReplies = falseなVRTL/VSTLにて含まれていない問題を修正
- feat(backend): `vmimiRelayTimelineImplemented` と `disableVmimiRelayTimeline` nodeinfo に追加しました
	- これによりサードパーティクライアントがVRTLの有無を認知できるようになりました。

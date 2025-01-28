# CHANGELOG about VRTL

VRTLのブランチで行われた変更点をまとめています

<!-- VV Please add changelog here VV -->

- fix(frontend): Unable to see VRTL when logged in

-- 2024.11.0-kinel.2 --
-- 2024.11.0-kinel.1 --
-- 2024.10.0-kinel.2 --
-- 2024.10.0-kinel.1 --
-- 2024.7.0-kinel.2 --

- fix(frontend): VRTL VSTLの名前が表示されないところがある問題 (anatawa12#97) - 2024/08/07
- fic(frontend): VRTL VSTLでリプライのトグルが表示されない問題 (anatawa12#92) - 2024/08/04

-- 2024.7.0-kinel.1 --

- chore(backend): VRTL参加サーバーの取得に失敗したときのリトライの間隔を短く
- feat: VRTL/VSTLに連合なし投稿を含めるかを選択可能に
  - もともとのVRTL/VSTLでは連合なし投稿が常に含まれていましたが、正しくVRTL/VSTLのノートを表現するために含めないようにできるようになりました
  - VSTLの場合、連合なし投稿を含めないようにしてもフォローしている人の連合なし投稿は表示されます
- fix(frontend): ウィジェットでVRTL/VSTLが使用できない問題を修正
- fix(backend): 自分自身に対するリプライがwithReplies = falseなVRTL/VSTLにて含まれていない問題を修正
- feat(backend): `vmimiRelayTimelineImplemented` と `disableVmimiRelayTimeline` nodeinfo に追加しました
	- これによりサードパーティクライアントがVRTLの有無を認知できるようになりました。

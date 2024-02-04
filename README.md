
# M.I.S.T.E.M.S.

Misskey Improvement and Synthesis Through Experimental Modified Systems.

**[Misskey](https://misskey-hub.net/)** の改善と統合に焦点を当て、それらを実現するために実験的かつ改良されたMisskeyシステム

---


## 方針と哲学
- 履歴の破壊が（頻繁に）行われる
	- 本家の取り込みが難しいとき、いつでもMISTEMS追加機能を切り離し、再度投入を試みるなど
- Misskey と互換性を保ちつつ高速で機能を取り入れる


| 変更対象             | 姿勢     | 解説                 |
|------------------|--------|--------------------|
| DBに対する変更         | かなり消極的 | マイグレーションが大変        |
| BEのAPIの削除        | かなり消極的 | 破壊的変更              |
| BEの既存のレスポンスの変更   | 消極的    | バグの修正は取り込むかも       |
| BEのレスポンスするカラムの追加 | 中立| よさそう               | 
| BEのAPIのエンドポイント追加 | 中立     | MISTEMSに閉じていればありうる |
| UIの改善・機能追加       | 積極的    | これが一番やりたいこと        |
| リファクタリング         | 行わない   | 本家（へ・の）の取り込みが困難になる |


- 転んでも泣かない


## MISTEMS CHANGELOG


#features (4)

- enhance: update datasaver switch titles (#16) ( ibuki2003 )
- enhance: ノート詳細ページでリプライ一覧と引用一覧を別々に表示するように (#14) (GrapeApple0, kakkokari-gtyih )
- 開いてるページで投稿先がチャンネルになってほしい misskey-dev#13028 (#13) (fruitriin, samunohito mesichicken )
- プロフィールの編集を検知できるようにした (#11) (mesichicken)

# fix (2)
- Fix hswipe animation control (#12) (kakkokari-gtyih)
- build libraries after install (#10)


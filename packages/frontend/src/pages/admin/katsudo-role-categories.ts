export const katsudoRoleCategories = [
	{
		key: 'position',
		label: '役職系',
		range: '9000〜9999',
		roleNames: ['管理人', 'モデレーター', '貢献者', '信頼できる人'],
	},
	{
		key: 'group',
		label: 'グループ系',
		range: '4000〜4999',
		roleNames: ['グループアカウント', 'グループメンバー募集中', '小説部'],
	},
	{
		key: 'fan',
		label: 'ファンロール系',
		range: '3000〜3999',
		roleNames: ['かつどうおばけ', 'かつどる親衛隊', 'タコス猫教信者', 'タコス猫教 教祖', 'からめん', 'くらげ民', 'しーうお隊'],
	},
	{
		key: 'activity',
		label: '活動系',
		range: '2000〜2999',
		roleNames: ['配信者', '絵チャ配信者', 'ゲーム実況者', 'YouTuber', 'ITuber', '歌い手', 'ボカロP', 'UTAU音源制作者', '絵師', 'ロゴ師', 'イラスト依頼受付中', '写真家', '声優'],
	},
	{
		key: 'restriction',
		label: '制限系',
		range: '6000〜6999',
		roleNames: ['ローカルできないよ', 'ホームでやろうね', 'グループの規約違反', '荒らし行為'],
	},
	{
		key: 'bot',
		label: 'bot系',
		range: '7000〜7999',
		roleNames: ['管理系bot'],
	},
	{
		key: 'fun',
		label: 'ネタ・称号系',
		range: '1000〜1999',
		roleNames: ['永住します', 'フラグ建築士', '暇人さん', 'まさかの知り合い'],
	},
	{
		key: 'uncategorized',
		label: '未分類',
		range: '番号帯未定',
		roleNames: [],
	},
] as const;

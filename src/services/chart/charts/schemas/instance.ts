import { types, bool } from '../../../../misc/schema';

/**
 * インスタンスごとのチャート
 */
export const schema = {
	type: types.object,
	optional: bool.false, nullable: bool.false,
	properties: {
		requests: {
			type: types.object,
			optional: bool.false, nullable: bool.false,
			properties: {
				failed: {
					type: types.number,
					optional: bool.false, nullable: bool.false,
					description: '失敗したリクエスト数'
				},
				succeeded: {
					type: types.number,
					optional: bool.false, nullable: bool.false,
					description: '成功したリクエスト数'
				},
				received: {
					type: types.number,
					optional: bool.false, nullable: bool.false,
					description: '受信したリクエスト数'
				},
			}
		},

		notes: {
			type: types.object,
			optional: bool.false, nullable: bool.false,
			properties: {
				total: {
					type: types.number,
					optional: bool.false, nullable: bool.false,
					description: '集計期間時点での、全投稿数'
				},
				inc: {
					type: types.number,
					optional: bool.false, nullable: bool.false,
					description: '増加した投稿数'
				},
				dec: {
					type: types.number,
					optional: bool.false, nullable: bool.false,
					description: '減少した投稿数'
				},

				diffs: {
					type: types.object,
					optional: bool.false, nullable: bool.false,
					properties: {
						normal: {
							type: types.number,
							optional: bool.false, nullable: bool.false,
							description: '通常の投稿数の差分'
						},

						reply: {
							type: types.number,
							optional: bool.false, nullable: bool.false,
							description: 'リプライの投稿数の差分'
						},

						renote: {
							type: types.number,
							optional: bool.false, nullable: bool.false,
							description: 'Renoteの投稿数の差分'
						},
					}
				},
			}
		},

		users: {
			type: types.object,
			optional: bool.false, nullable: bool.false,
			properties: {
				total: {
					type: types.number,
					optional: bool.false, nullable: bool.false,
					description: '集計期間時点での、全ユーザー数'
				},
				inc: {
					type: types.number,
					optional: bool.false, nullable: bool.false,
					description: '増加したユーザー数'
				},
				dec: {
					type: types.number,
					optional: bool.false, nullable: bool.false,
					description: '減少したユーザー数'
				},
			}
		},

		following: {
			type: types.object,
			optional: bool.false, nullable: bool.false,
			properties: {
				total: {
					type: types.number,
					optional: bool.false, nullable: bool.false,
					description: '集計期間時点での、全フォロー数'
				},
				inc: {
					type: types.number,
					optional: bool.false, nullable: bool.false,
					description: '増加したフォロー数'
				},
				dec: {
					type: types.number,
					optional: bool.false, nullable: bool.false,
					description: '減少したフォロー数'
				},
			}
		},

		followers: {
			type: types.object,
			optional: bool.false, nullable: bool.false,
			properties: {
				total: {
					type: types.number,
					optional: bool.false, nullable: bool.false,
					description: '集計期間時点での、全フォロワー数'
				},
				inc: {
					type: types.number,
					optional: bool.false, nullable: bool.false,
					description: '増加したフォロワー数'
				},
				dec: {
					type: types.number,
					optional: bool.false, nullable: bool.false,
					description: '減少したフォロワー数'
				},
			}
		},

		drive: {
			type: types.object,
			optional: bool.false, nullable: bool.false,
			properties: {
				totalFiles: {
					type: types.number,
					optional: bool.false, nullable: bool.false,
					description: '集計期間時点での、全ドライブファイル数'
				},
				totalUsage: {
					type: types.number,
					optional: bool.false, nullable: bool.false,
					description: '集計期間時点での、全ドライブファイルの合計サイズ'
				},
				incFiles: {
					type: types.number,
					optional: bool.false, nullable: bool.false,
					description: '増加したドライブファイル数'
				},
				incUsage: {
					type: types.number,
					optional: bool.false, nullable: bool.false,
					description: '増加したドライブ使用量'
				},
				decFiles: {
					type: types.number,
					optional: bool.false, nullable: bool.false,
					description: '減少したドライブファイル数'
				},
				decUsage: {
					type: types.number,
					optional: bool.false, nullable: bool.false,
					description: '減少したドライブ使用量'
				},
			}
		},
	}
};

export const name = 'instance';

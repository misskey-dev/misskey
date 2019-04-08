/**
 * インスタンスごとのチャート
 */
export const schema = {
	type: 'object' as 'object',
	properties: {
		requests: {
			type: 'object' as 'object',
			properties: {
				failed: {
					type: 'number' as 'number',
					description: '失敗したリクエスト数'
				},
				succeeded: {
					type: 'number' as 'number',
					description: '成功したリクエスト数'
				},
				received: {
					type: 'number' as 'number',
					description: '受信したリクエスト数'
				},
			}
		},

		notes: {
			type: 'object' as 'object',
			properties: {
				total: {
					type: 'number' as 'number',
					description: '集計期間時点での、全投稿数'
				},
				inc: {
					type: 'number' as 'number',
					description: '増加した投稿数'
				},
				dec: {
					type: 'number' as 'number',
					description: '減少した投稿数'
				},

				diffs: {
					type: 'object' as 'object',
					properties: {
						normal: {
							type: 'number' as 'number',
							description: '通常の投稿数の差分'
						},

						reply: {
							type: 'number' as 'number',
							description: 'リプライの投稿数の差分'
						},

						renote: {
							type: 'number' as 'number',
							description: 'Renoteの投稿数の差分'
						},
					}
				},
			}
		},

		users: {
			type: 'object' as 'object',
			properties: {
				total: {
					type: 'number' as 'number',
					description: '集計期間時点での、全ユーザー数'
				},
				inc: {
					type: 'number' as 'number',
					description: '増加したユーザー数'
				},
				dec: {
					type: 'number' as 'number',
					description: '減少したユーザー数'
				},
			}
		},

		following: {
			type: 'object' as 'object',
			properties: {
				total: {
					type: 'number' as 'number',
					description: '集計期間時点での、全フォロー数'
				},
				inc: {
					type: 'number' as 'number',
					description: '増加したフォロー数'
				},
				dec: {
					type: 'number' as 'number',
					description: '減少したフォロー数'
				},
			}
		},

		followers: {
			type: 'object' as 'object',
			properties: {
				total: {
					type: 'number' as 'number',
					description: '集計期間時点での、全フォロワー数'
				},
				inc: {
					type: 'number' as 'number',
					description: '増加したフォロワー数'
				},
				dec: {
					type: 'number' as 'number',
					description: '減少したフォロワー数'
				},
			}
		},

		drive: {
			type: 'object' as 'object',
			properties: {
				totalFiles: {
					type: 'number' as 'number',
					description: '集計期間時点での、全ドライブファイル数'
				},
				totalUsage: {
					type: 'number' as 'number',
					description: '集計期間時点での、全ドライブファイルの合計サイズ'
				},
				incFiles: {
					type: 'number' as 'number',
					description: '増加したドライブファイル数'
				},
				incUsage: {
					type: 'number' as 'number',
					description: '増加したドライブ使用量'
				},
				decFiles: {
					type: 'number' as 'number',
					description: '減少したドライブファイル数'
				},
				decUsage: {
					type: 'number' as 'number',
					description: '減少したドライブ使用量'
				},
			}
		},
	}
};

export const name = 'instance';

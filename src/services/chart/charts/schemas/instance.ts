/**
 * インスタンスごとのチャート
 */
export const schema = {
	type: 'object' as const,
	optional: false as const, nullable: false as const,
	properties: {
		requests: {
			type: 'object' as const,
			optional: false as const, nullable: false as const,
			properties: {
				failed: {
					type: 'number' as const,
					optional: false as const, nullable: false as const,
					description: '失敗したリクエスト数'
				},
				succeeded: {
					type: 'number' as const,
					optional: false as const, nullable: false as const,
					description: '成功したリクエスト数'
				},
				received: {
					type: 'number' as const,
					optional: false as const, nullable: false as const,
					description: '受信したリクエスト数'
				},
			}
		},

		notes: {
			type: 'object' as const,
			optional: false as const, nullable: false as const,
			properties: {
				total: {
					type: 'number' as const,
					optional: false as const, nullable: false as const,
					description: '集計期間時点での、全投稿数'
				},
				inc: {
					type: 'number' as const,
					optional: false as const, nullable: false as const,
					description: '増加した投稿数'
				},
				dec: {
					type: 'number' as const,
					optional: false as const, nullable: false as const,
					description: '減少した投稿数'
				},

				diffs: {
					type: 'object' as const,
					optional: false as const, nullable: false as const,
					properties: {
						normal: {
							type: 'number' as const,
							optional: false as const, nullable: false as const,
							description: '通常の投稿数の差分'
						},

						reply: {
							type: 'number' as const,
							optional: false as const, nullable: false as const,
							description: 'リプライの投稿数の差分'
						},

						renote: {
							type: 'number' as const,
							optional: false as const, nullable: false as const,
							description: 'Renoteの投稿数の差分'
						},
					}
				},
			}
		},

		users: {
			type: 'object' as const,
			optional: false as const, nullable: false as const,
			properties: {
				total: {
					type: 'number' as const,
					optional: false as const, nullable: false as const,
					description: '集計期間時点での、全ユーザー数'
				},
				inc: {
					type: 'number' as const,
					optional: false as const, nullable: false as const,
					description: '増加したユーザー数'
				},
				dec: {
					type: 'number' as const,
					optional: false as const, nullable: false as const,
					description: '減少したユーザー数'
				},
			}
		},

		following: {
			type: 'object' as const,
			optional: false as const, nullable: false as const,
			properties: {
				total: {
					type: 'number' as const,
					optional: false as const, nullable: false as const,
					description: '集計期間時点での、全フォロー数'
				},
				inc: {
					type: 'number' as const,
					optional: false as const, nullable: false as const,
					description: '増加したフォロー数'
				},
				dec: {
					type: 'number' as const,
					optional: false as const, nullable: false as const,
					description: '減少したフォロー数'
				},
			}
		},

		followers: {
			type: 'object' as const,
			optional: false as const, nullable: false as const,
			properties: {
				total: {
					type: 'number' as const,
					optional: false as const, nullable: false as const,
					description: '集計期間時点での、全フォロワー数'
				},
				inc: {
					type: 'number' as const,
					optional: false as const, nullable: false as const,
					description: '増加したフォロワー数'
				},
				dec: {
					type: 'number' as const,
					optional: false as const, nullable: false as const,
					description: '減少したフォロワー数'
				},
			}
		},

		drive: {
			type: 'object' as const,
			optional: false as const, nullable: false as const,
			properties: {
				totalFiles: {
					type: 'number' as const,
					optional: false as const, nullable: false as const,
					description: '集計期間時点での、全ドライブファイル数'
				},
				totalUsage: {
					type: 'number' as const,
					optional: false as const, nullable: false as const,
					description: '集計期間時点での、全ドライブファイルの合計サイズ'
				},
				incFiles: {
					type: 'number' as const,
					optional: false as const, nullable: false as const,
					description: '増加したドライブファイル数'
				},
				incUsage: {
					type: 'number' as const,
					optional: false as const, nullable: false as const,
					description: '増加したドライブ使用量'
				},
				decFiles: {
					type: 'number' as const,
					optional: false as const, nullable: false as const,
					description: '減少したドライブファイル数'
				},
				decUsage: {
					type: 'number' as const,
					optional: false as const, nullable: false as const,
					description: '減少したドライブ使用量'
				},
			}
		},
	}
};

export const name = 'instance';

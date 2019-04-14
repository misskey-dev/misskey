export const schema = {
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
};

export const name = 'perUserNotes';

/**
 * フェデレーションに関するチャート
 */
export const schema = {
	type: 'object' as 'object',
	properties: {
		instance: {
			type: 'object' as 'object',
			properties: {
				total: {
					type: 'number' as 'number',
					description: 'インスタンス数の合計'
				},
				inc: {
					type: 'number' as 'number',
					description: '増加インスタンス数'
				},
				dec: {
					type: 'number' as 'number',
					description: '減少インスタンス数'
				},
			}
		}
	}
};

export const name = 'federation';

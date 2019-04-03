export const schema = {
	type: 'object' as 'object',
	properties: {
		foo: {
			type: 'object' as 'object',
			properties: {
				total: {
					type: 'number' as 'number',
					description: ''
				},

				inc: {
					type: 'number' as 'number',
					description: ''
				},

				dec: {
					type: 'number' as 'number',
					description: ''
				},
			}
		}
	}
};

export const name = 'testGrouped';

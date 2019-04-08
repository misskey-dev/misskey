export const logSchema = {
	/**
	 * フォローしている
	 */
	followings: {
		type: 'object' as 'object',
		properties: {
			/**
			 * フォローしている合計
			 */
			total: {
				type: 'number' as 'number',
				description: 'フォローしている合計',
			},

			/**
			 * フォローした数
			 */
			inc: {
				type: 'number' as 'number',
				description: 'フォローした数',
			},

			/**
			 * フォロー解除した数
			 */
			dec: {
				type: 'number' as 'number',
				description: 'フォロー解除した数',
			},
		}
	},

	/**
	 * フォローされている
	 */
	followers: {
		type: 'object' as 'object',
		properties: {
			/**
			 * フォローされている合計
			 */
			total: {
				type: 'number' as 'number',
				description: 'フォローされている合計',
			},

			/**
			 * フォローされた数
			 */
			inc: {
				type: 'number' as 'number',
				description: 'フォローされた数',
			},

			/**
			 * フォロー解除された数
			 */
			dec: {
				type: 'number' as 'number',
				description: 'フォロー解除された数',
			},
		}
	},
};

export const schema = {
	type: 'object' as 'object',
	properties: {
		local: {
			type: 'object' as 'object',
			properties: logSchema
		},
		remote: {
			type: 'object' as 'object',
			properties: logSchema
		},
	}
};

export const name = 'perUserFollowing';

export const logSchema = {
	/**
	 * フォローしている
	 */
	followings: {
		type: 'object' as const,
		optional: false as const, nullable: false as const,
		properties: {
			/**
			 * フォローしている合計
			 */
			total: {
				type: 'number' as const,
				optional: false as const, nullable: false as const,
				description: 'フォローしている合計',
			},

			/**
			 * フォローした数
			 */
			inc: {
				type: 'number' as const,
				optional: false as const, nullable: false as const,
				description: 'フォローした数',
			},

			/**
			 * フォロー解除した数
			 */
			dec: {
				type: 'number' as const,
				optional: false as const, nullable: false as const,
				description: 'フォロー解除した数',
			},
		}
	},

	/**
	 * フォローされている
	 */
	followers: {
		type: 'object' as const,
		optional: false as const, nullable: false as const,
		properties: {
			/**
			 * フォローされている合計
			 */
			total: {
				type: 'number' as const,
				optional: false as const, nullable: false as const,
				description: 'フォローされている合計',
			},

			/**
			 * フォローされた数
			 */
			inc: {
				type: 'number' as const,
				optional: false as const, nullable: false as const,
				description: 'フォローされた数',
			},

			/**
			 * フォロー解除された数
			 */
			dec: {
				type: 'number' as const,
				optional: false as const, nullable: false as const,
				description: 'フォロー解除された数',
			},
		}
	},
};

export const schema = {
	type: 'object' as const,
	optional: false as const, nullable: false as const,
	properties: {
		local: {
			type: 'object' as const,
			optional: false as const, nullable: false as const,
			properties: logSchema
		},
		remote: {
			type: 'object' as const,
			optional: false as const, nullable: false as const,
			properties: logSchema
		},
	}
};

export const name = 'perUserFollowing';

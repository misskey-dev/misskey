import Chart from '../../core';

export const name = 'perUserFollowing';

const logSchema = {
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
			},

			/**
			 * フォローした数
			 */
			inc: {
				type: 'number' as const,
				optional: false as const, nullable: false as const,
			},

			/**
			 * フォロー解除した数
			 */
			dec: {
				type: 'number' as const,
				optional: false as const, nullable: false as const,
			},
		},
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
			},

			/**
			 * フォローされた数
			 */
			inc: {
				type: 'number' as const,
				optional: false as const, nullable: false as const,
			},

			/**
			 * フォロー解除された数
			 */
			dec: {
				type: 'number' as const,
				optional: false as const, nullable: false as const,
			},
		},
	},
};

export const schema = {
	type: 'object' as const,
	optional: false as const, nullable: false as const,
	properties: {
		local: {
			type: 'object' as const,
			optional: false as const, nullable: false as const,
			properties: logSchema,
		},
		remote: {
			type: 'object' as const,
			optional: false as const, nullable: false as const,
			properties: logSchema,
		},
	},
};

export const entity = Chart.schemaToEntity(name, schema, true);

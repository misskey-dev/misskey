import { types, bool } from '../../../../misc/schema';

export const logSchema = {
	/**
	 * フォローしている
	 */
	followings: {
		type: types.object,
		optional: bool.false, nullable: bool.false,
		properties: {
			/**
			 * フォローしている合計
			 */
			total: {
				type: types.number,
				optional: bool.false, nullable: bool.false,
				description: 'フォローしている合計',
			},

			/**
			 * フォローした数
			 */
			inc: {
				type: types.number,
				optional: bool.false, nullable: bool.false,
				description: 'フォローした数',
			},

			/**
			 * フォロー解除した数
			 */
			dec: {
				type: types.number,
				optional: bool.false, nullable: bool.false,
				description: 'フォロー解除した数',
			},
		}
	},

	/**
	 * フォローされている
	 */
	followers: {
		type: types.object,
		optional: bool.false, nullable: bool.false,
		properties: {
			/**
			 * フォローされている合計
			 */
			total: {
				type: types.number,
				optional: bool.false, nullable: bool.false,
				description: 'フォローされている合計',
			},

			/**
			 * フォローされた数
			 */
			inc: {
				type: types.number,
				optional: bool.false, nullable: bool.false,
				description: 'フォローされた数',
			},

			/**
			 * フォロー解除された数
			 */
			dec: {
				type: types.number,
				optional: bool.false, nullable: bool.false,
				description: 'フォロー解除された数',
			},
		}
	},
};

export const schema = {
	type: types.object,
	properties: {
		local: {
			type: types.object,
			properties: logSchema
		},
		remote: {
			type: types.object,
			properties: logSchema
		},
	}
};

export const name = 'perUserFollowing';

import $ from 'cafy';
import define from '../../define';
import { ApiError } from '../../error';
import { Users, UserProfiles } from '../../../../models';
import { ID } from '../../../../misc/cafy-id';
import { toPunyNullable } from '../../../../misc/convert-host';

export const meta = {
	desc: {
		'ja-JP': '指定した部屋の情報を取得します。',
	},

	tags: ['room'],

	requireCredential: false as const,

	params: {
		userId: {
			validator: $.optional.type(ID),
			desc: {
				'ja-JP': '対象のユーザーのID',
				'en-US': 'Target user ID'
			}
		},

		username: {
			validator: $.optional.str
		},

		host: {
			validator: $.optional.nullable.str
		},
	},

	errors: {
		noSuchUser: {
			message: 'No such user.',
			code: 'NO_SUCH_USER',
			id: '7ad3fa3e-5e12-42f0-b23a-f3d13f10ee4b'
		}
	}
};

export default define(meta, async (ps, me) => {
	const user = await Users.findOne(ps.userId != null
		? { id: ps.userId }
		: { usernameLower: ps.username!.toLowerCase(), host: toPunyNullable(ps.host) });

	if (user == null) {
		throw new ApiError(meta.errors.noSuchUser);
	}

	const profile = await UserProfiles.findOneOrFail(user.id);

	if (profile.room.furnitures == null) {
		await UserProfiles.update(user.id, {
			room: {
				furnitures: [],
				...profile.room
			}
		});

		profile.room.furnitures = [];
	}

	if (profile.room.roomType == null) {
		const initialType = 'default';
		await UserProfiles.update(user.id, {
			room: {
				roomType: initialType as any,
				...profile.room
			}
		});

		profile.room.roomType = initialType;
	}

	if (profile.room.carpetColor == null) {
		const initialColor = '#85CAF0';
		await UserProfiles.update(user.id, {
			room: {
				carpetColor: initialColor as any,
				...profile.room
			}
		});

		profile.room.carpetColor = initialColor;
	}

	return profile.room;
});

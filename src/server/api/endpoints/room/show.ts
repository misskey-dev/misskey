import $ from 'cafy';
import define from '../../define';
import { ApiError } from '../../error';
import { Users, UserProfiles } from '@/models/index';
import { ID } from '@/misc/cafy-id';
import { toPunyNullable } from '@/misc/convert-host';

export const meta = {
	tags: ['room'],

	requireCredential: false as const,

	params: {
		userId: {
			validator: $.optional.type(ID),
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
	},

	res: {
		type: 'object' as const,
		optional: false as const, nullable: false as const,
		properties: {
			roomType: {
				type: 'string' as const,
				optional: false as const, nullable: false as const,
				enum: ['default', 'washitsu']
			},
			furnitures: {
				type: 'array' as const,
				optional: false as const, nullable: false as const,
				items: {
					type: 'object' as const,
					optional: false as const, nullable: false as const,
					properties: {
						id: {
							type: 'string' as const,
							optional: false as const, nullable: false as const
						},
						type: {
							type: 'string' as const,
							optional: false as const, nullable: false as const
						},
						props: {
							type: 'object' as const,
							optional: true as const, nullable: false as const,
						},
						position: {
							type: 'object' as const,
							optional: false as const, nullable: false as const,
							properties: {
								x: {
									type: 'number' as const,
									optional: false as const, nullable: false as const
								},
								y: {
									type: 'number' as const,
									optional: false as const, nullable: false as const
								},
								z: {
									type: 'number' as const,
									optional: false as const, nullable: false as const
								}
							}
						},
						rotation: {
							type: 'object' as const,
							optional: false as const, nullable: false as const,
							properties: {
								x: {
									type: 'number' as const,
									optional: false as const, nullable: false as const
								},
								y: {
									type: 'number' as const,
									optional: false as const, nullable: false as const
								},
								z: {
									type: 'number' as const,
									optional: false as const, nullable: false as const
								}
							}
						}
					}
				}
			},
			carpetColor: {
				type: 'string' as const,
				optional: false as const, nullable: false as const,
				format: 'hex',
				example: '#85CAF0'
			}
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

import { Inject, Injectable } from '@nestjs/common';
import { DI } from '@/di-symbols.js';
import type {
	FollowingsRepository,
	UserProfilesRepository,
} from '@/models/_.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { UserEntityService } from '@/core/entities/UserEntityService.js';
import type { Packed } from '@/misc/json-schema.js';

export const meta = {
	tags: ['users'],

	requireCredential: true,
	kind: 'read:account',

	description: 'Find users who have a birthday on the specified range.',

	res: {
		type: 'array',
		optional: false, nullable: false,
		items: {
			type: 'object',
			optional: false, nullable: false,
			properties: {
				birthday: {
					type: 'string', format: 'date-time',
					optional: false, nullable: false,
				},
				user: {
					type: 'object',
					optional: false, nullable: false,
					ref: 'UserLite',
				},
			},
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
		offset: { type: 'integer', default: 0 },
		birthday: {
			type: 'object',
			properties: {
				month: { type: 'integer', minimum: 1, maximum: 12 },
				day: { type: 'integer', minimum: 1, maximum: 31 },
				begin: {
					type: 'object',
					properties: {
						month: { type: 'integer', minimum: 1, maximum: 12 },
						day: { type: 'integer', minimum: 1, maximum: 31 },
					},
					required: ['month', 'day'],
				},
				end: {
					type: 'object',
					properties: {
						month: { type: 'integer', minimum: 1, maximum: 12 },
						day: { type: 'integer', minimum: 1, maximum: 31 },
					},
					required: ['month', 'day'],
				},
			},
			anyOf: [
				{ required: ['month', 'day'] },
				{ required: ['begin', 'end'] },
			],
		},
	},
	required: ['birthday'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.userProfilesRepository)
		private userProfilesRepository: UserProfilesRepository,
		@Inject(DI.followingsRepository)
		private followingsRepository: FollowingsRepository,

		private userEntityService: UserEntityService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const query = this.followingsRepository
				.createQueryBuilder('following')
				.andWhere('following.followerId = :userId', { userId: me.id })
				.innerJoin(this.userProfilesRepository.metadata.targetName, 'followeeProfile', 'followeeProfile.userId = following.followeeId');

			if (Object.hasOwn(ps.birthday, 'begin') && Object.hasOwn(ps.birthday, 'end')) {
				const { begin, end } = ps.birthday as { begin: { month: number; day: number }; end: { month: number; day: number }; };
				query.andWhere('get_birthday_date(followeeProfile.birthday) BETWEEN :begin AND :end', { begin: begin.month * 100 + begin.day, end: end.month * 100 + end.day });
			} else {
				const { month, day } = ps.birthday as { month: number; day: number };
				// なぜか get_birthday_date() = :birthday だとインデックスが効かないので、BETWEEN で対応
				query.andWhere('get_birthday_date(followeeProfile.birthday) BETWEEN :birthday AND :birthday', { birthday: month * 100 + day });
			}

			query.select('following.followeeId', 'user_id');
			query.addSelect('get_birthday_date(followeeProfile.birthday)', 'birthday_date');
			query.orderBy('birthday_date', 'ASC');

			const birthdayUsers = await query
				.offset(ps.offset).limit(ps.limit)
				.getRawMany<{ birthday_date: number; user_id: string }>();

			const users = new Map<string, Packed<'UserLite'>>((
				await this.userEntityService.packMany(
					birthdayUsers.map(u => u.user_id),
					me,
					{ schema: 'UserLite' },
				)
			).map(u => [u.id, u]));

			return birthdayUsers
				.map(item => {
					const birthday = new Date();
					birthday.setMonth(Math.floor(item.birthday_date / 100) - 1);
					birthday.setDate(item.birthday_date % 100);
					birthday.setHours(0, 0, 0, 0);
					if (birthday.getTime() < Date.now()) birthday.setFullYear(new Date().getFullYear() + 1);
					return { birthday: birthday.toISOString(), user: users.get(item.user_id) };
				})
				.filter(item => item.user !== undefined)
				.map(item => item as { birthday: string; user: Packed<'UserLite'> });
		});
	}
}

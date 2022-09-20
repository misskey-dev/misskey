import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { IdService } from '@/core/IdService.js';
import type { UserListsRepository, UserGroupJoiningsRepository, AntennasRepository } from '@/models/index.js';
import { GlobalEventService } from '@/core/GlobalEventService.js';
import { AntennaEntityService } from '@/core/entities/AntennaEntityService.js';
import { DI } from '@/di-symbols.js';
import { ApiError } from '../../error.js';

export const meta = {
	tags: ['antennas'],

	requireCredential: true,

	kind: 'write:account',

	errors: {
		noSuchUserList: {
			message: 'No such user list.',
			code: 'NO_SUCH_USER_LIST',
			id: '95063e93-a283-4b8b-9aa5-bcdb8df69a7f',
		},

		noSuchUserGroup: {
			message: 'No such user group.',
			code: 'NO_SUCH_USER_GROUP',
			id: 'aa3c0b9a-8cae-47c0-92ac-202ce5906682',
		},
	},

	res: {
		type: 'object',
		optional: false, nullable: false,
		ref: 'Antenna',
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		name: { type: 'string', minLength: 1, maxLength: 100 },
		src: { type: 'string', enum: ['home', 'all', 'users', 'list', 'group'] },
		userListId: { type: 'string', format: 'misskey:id', nullable: true },
		userGroupId: { type: 'string', format: 'misskey:id', nullable: true },
		keywords: { type: 'array', items: {
			type: 'array', items: {
				type: 'string',
			},
		} },
		excludeKeywords: { type: 'array', items: {
			type: 'array', items: {
				type: 'string',
			},
		} },
		users: { type: 'array', items: {
			type: 'string',
		} },
		caseSensitive: { type: 'boolean' },
		withReplies: { type: 'boolean' },
		withFile: { type: 'boolean' },
		notify: { type: 'boolean' },
	},
	required: ['name', 'src', 'keywords', 'excludeKeywords', 'users', 'caseSensitive', 'withReplies', 'withFile', 'notify'],
} as const;

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		@Inject(DI.antennasRepository)
		private antennasRepository: AntennasRepository,

		@Inject(DI.userListsRepository)
		private userListsRepository: UserListsRepository,

		@Inject(DI.userGroupJoiningsRepository)
		private userGroupJoiningsRepository: UserGroupJoiningsRepository,

		private antennaEntityService: AntennaEntityService,
		private idService: IdService,
		private globalEventService: GlobalEventService,
	) {
		super(meta, paramDef, async (ps, me) => {
			let userList;
			let userGroupJoining;

			if (ps.src === 'list' && ps.userListId) {
				userList = await this.userListsRepository.findOneBy({
					id: ps.userListId,
					userId: me.id,
				});

				if (userList == null) {
					throw new ApiError(meta.errors.noSuchUserList);
				}
			} else if (ps.src === 'group' && ps.userGroupId) {
				userGroupJoining = await this.userGroupJoiningsRepository.findOneBy({
					userGroupId: ps.userGroupId,
					userId: me.id,
				});

				if (userGroupJoining == null) {
					throw new ApiError(meta.errors.noSuchUserGroup);
				}
			}

			const antenna = await this.antennasRepository.insert({
				id: this.idService.genId(),
				createdAt: new Date(),
				userId: me.id,
				name: ps.name,
				src: ps.src,
				userListId: userList ? userList.id : null,
				userGroupJoiningId: userGroupJoining ? userGroupJoining.id : null,
				keywords: ps.keywords,
				excludeKeywords: ps.excludeKeywords,
				users: ps.users,
				caseSensitive: ps.caseSensitive,
				withReplies: ps.withReplies,
				withFile: ps.withFile,
				notify: ps.notify,
			}).then(x => this.antennasRepository.findOneByOrFail(x.identifiers[0]));

			this.globalEventService.publishInternalEvent('antennaCreated', antenna);

			return await this.antennaEntityService.pack(antenna);
		});
	}
}

import { Inject, Injectable } from '@nestjs/common';
import { UserLists } from '@/models/index.js';
import { genId } from '@/misc/gen-id.js';
import type { UserList } from '@/models/entities/user-list.js';
import { Endpoint } from '@/server/api/endpoint-base.js';

export const meta = {
	tags: ['lists'],

	requireCredential: true,

	kind: 'write:account',

	description: 'Create a new list of users.',

	res: {
		type: 'object',
		optional: false, nullable: false,
		ref: 'UserList',
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		name: { type: 'string', minLength: 1, maxLength: 100 },
	},
	required: ['name'],
} as const;

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		@Inject('usersRepository')
    private usersRepository: typeof Users,

		@Inject('notesRepository')
    private notesRepository: typeof Notes,
	) {
		super(meta, paramDef, async (ps, user) => {
			const userList = await UserLists.insert({
				id: genId(),
				createdAt: new Date(),
				userId: user.id,
				name: ps.name,
			} as UserList).then(x => UserLists.findOneByOrFail(x.identifiers[0]));

			return await UserLists.pack(userList);
		});
	}
}

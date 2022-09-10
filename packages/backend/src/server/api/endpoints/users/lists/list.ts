import { Inject, Injectable } from '@nestjs/common';
import { UserLists } from '@/models/index.js';
import { Endpoint } from '@/server/api/endpoint-base.js';

export const meta = {
	tags: ['lists', 'account'],

	requireCredential: true,

	kind: 'read:account',

	description: 'Show all lists that the authenticated user has created.',

	res: {
		type: 'array',
		optional: false, nullable: false,
		items: {
			type: 'object',
			optional: false, nullable: false,
			ref: 'UserList',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {},
	required: [],
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
		super(meta, paramDef, async (ps, me) => {
			const userLists = await UserLists.findBy({
				userId: me.id,
			});

			return await Promise.all(userLists.map(x => UserLists.pack(x)));
		});
	}
}

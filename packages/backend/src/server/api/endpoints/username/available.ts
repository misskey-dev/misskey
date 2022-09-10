import { IsNull } from 'typeorm';
import { Users, UsedUsernames } from '@/models/index.js';
import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';

export const meta = {
	tags: ['users'],

	requireCredential: false,

	res: {
		type: 'object',
		optional: false, nullable: false,
		properties: {
			available: {
				type: 'boolean',
				optional: false, nullable: false,
			},
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		username: Users.localUsernameSchema,
	},
	required: ['username'],
} as const;

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		@Inject('notesRepository')
    private notesRepository: typeof Notes,
	) {
		super(meta, paramDef, async (ps, user) => {
	// Get exist
	const exist = await Users.countBy({
		host: IsNull(),
		usernameLower: ps.username.toLowerCase(),
	});

	const exist2 = await UsedUsernames.countBy({ username: ps.username.toLowerCase() });

	return {
		available: exist === 0 && exist2 === 0,
	};
});

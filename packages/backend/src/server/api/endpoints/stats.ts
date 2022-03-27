import define from '../define.js';
import { Instances, NoteReactions, Notes, Users } from '@/models/index.js';
import { } from '@/services/chart/index.js';
import { IsNull } from 'typeorm';

export const meta = {
	requireCredential: false,

	tags: ['meta'],

	res: {
		type: 'object',
		optional: false, nullable: false,
		properties: {
			notesCount: {
				type: 'number',
				optional: false, nullable: false,
			},
			originalNotesCount: {
				type: 'number',
				optional: false, nullable: false,
			},
			usersCount: {
				type: 'number',
				optional: false, nullable: false,
			},
			originalUsersCount: {
				type: 'number',
				optional: false, nullable: false,
			},
			instances: {
				type: 'number',
				optional: false, nullable: false,
			},
			driveUsageLocal: {
				type: 'number',
				optional: false, nullable: false,
			},
			driveUsageRemote: {
				type: 'number',
				optional: false, nullable: false,
			},
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {},
	required: [],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async () => {
	const [
		notesCount,
		originalNotesCount,
		usersCount,
		originalUsersCount,
		reactionsCount,
		//originalReactionsCount,
		instances,
	] = await Promise.all([
		Notes.count({ cache: 3600000 }), // 1 hour
		Notes.count({ where: { userHost: IsNull() }, cache: 3600000 }),
		Users.count({ cache: 3600000 }),
		Users.count({ where: { host: IsNull() }, cache: 3600000 }),
		NoteReactions.count({ cache: 3600000 }), // 1 hour
		//NoteReactions.count({ where: { userHost: IsNull() }, cache: 3600000 }),
		Instances.count({ cache: 3600000 }),
	]);

	return {
		notesCount,
		originalNotesCount,
		usersCount,
		originalUsersCount,
		reactionsCount,
		//originalReactionsCount,
		instances,
		driveUsageLocal: 0,
		driveUsageRemote: 0,
	};
});

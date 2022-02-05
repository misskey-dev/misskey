import define from '../define';
import { NoteReactions, Notes, Users } from '@/models/index';
import { federationChart, driveChart } from '@/services/chart/index';

export const meta = {
	requireCredential: false,

	tags: ['meta'],

	params: {
	},

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

// eslint-disable-next-line import/no-default-export
export default define(meta, async () => {
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
		Notes.count({ where: { userHost: null }, cache: 3600000 }),
		Users.count({ cache: 3600000 }),
		Users.count({ where: { host: null }, cache: 3600000 }),
		NoteReactions.count({ cache: 3600000 }), // 1 hour
		//NoteReactions.count({ where: { userHost: null }, cache: 3600000 }),
		federationChart.getChart('hour', 1, null).then(chart => chart.instance.total[0]),
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

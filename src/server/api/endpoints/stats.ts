import define from '../define';
import { NoteReactions, Notes, Users } from '../../../models';
import { federationChart, driveChart } from '../../../services/chart';

export const meta = {
	requireCredential: false as const,

	desc: {
		'ja-JP': 'インスタンスの統計を取得します。',
		'en-US': 'Get the instance\'s statistics'
	},

	tags: ['meta'],

	params: {
	},

	res: {
		type: 'object' as const,
		optional: false as const, nullable: false as const,
		properties: {
			notesCount: {
				type: 'number' as const,
				optional: false as const, nullable: false as const,
				description: 'The count of all (local/remote) notes of this instance.',
			},
			originalNotesCount: {
				type: 'number' as const,
				optional: false as const, nullable: false as const,
				description: 'The count of all local notes of this instance.',
			},
			usersCount: {
				type: 'number' as const,
				optional: false as const, nullable: false as const,
				description: 'The count of all (local/remote) accounts of this instance.',
			},
			originalUsersCount: {
				type: 'number' as const,
				optional: false as const, nullable: false as const,
				description: 'The count of all local accounts of this instance.',
			},
			instances: {
				type: 'number' as const,
				optional: false as const, nullable: false as const,
				description: 'The count of federated instances.',
			},
			driveUsageLocal: {
				type: 'number' as const,
				optional: false as const, nullable: false as const
			},
			driveUsageRemote: {
				type: 'number' as const,
				optional: false as const, nullable: false as const
			}
		}
	}
};

export default define(meta, async () => {
	const [
		notesCount,
		originalNotesCount,
		usersCount,
		originalUsersCount,
		reactionsCount,
		//originalReactionsCount,
		instances,
		driveUsageLocal,
		driveUsageRemote
	] = await Promise.all([
		Notes.count({ cache: 3600000 }), // 1 hour
		Notes.count({ where: { userHost: null }, cache: 3600000 }),
		Users.count({ cache: 3600000 }),
		Users.count({ where: { host: null }, cache: 3600000 }),
		NoteReactions.count({ cache: 3600000 }), // 1 hour
		//NoteReactions.count({ where: { userHost: null }, cache: 3600000 }),
		federationChart.getChart('hour', 1, null).then(chart => chart.instance.total[0]),
		driveChart.getChart('hour', 1, null).then(chart => chart.local.totalSize[0]),
		driveChart.getChart('hour', 1, null).then(chart => chart.remote.totalSize[0]),
	]);

	return {
		notesCount,
		originalNotesCount,
		usersCount,
		originalUsersCount,
		reactionsCount,
		//originalReactionsCount,
		instances,
		driveUsageLocal,
		driveUsageRemote
	};
});

import define from '../define';
import { Notes, Users } from '../../../models';
import { federationChart, driveChart } from '../../../services/chart';
import { bool, types } from '../../../misc/schema';

export const meta = {
	requireCredential: false,

	desc: {
		'en-US': 'Get the instance\'s statistics'
	},

	tags: ['meta'],

	params: {
	},

	res: {
		type: types.object,
		optional: bool.false, nullable: bool.false,
		properties: {
			notesCount: {
				type: types.number,
				optional: bool.false, nullable: bool.false,
				description: 'The count of all (local/remote) notes of this instance.',
			},
			originalNotesCount: {
				type: types.number,
				optional: bool.false, nullable: bool.false,
				description: 'The count of all local notes of this instance.',
			},
			usersCount: {
				type: types.number,
				optional: bool.false, nullable: bool.false,
				description: 'The count of all (local/remote) accounts of this instance.',
			},
			originalUsersCount: {
				type: types.number,
				optional: bool.false, nullable: bool.false,
				description: 'The count of all local accounts of this instance.',
			},
			instances: {
				type: types.number,
				optional: bool.false, nullable: bool.false,
				description: 'The count of federated instances.',
			},
		}
	}
};

export default define(meta, async () => {
	const [notesCount,
		originalNotesCount,
		usersCount,
		originalUsersCount,
		instances,
		driveUsageLocal,
		driveUsageRemote
	] = await Promise.all([
		Notes.count({ cache: 3600000 }), // 1 hour
		Notes.count({ where: { userHost: null }, cache: 3600000 }),
		Users.count({ cache: 3600000 }),
		Users.count({ where: { host: null }, cache: 3600000 }),
		federationChart.getChart('hour', 1).then(chart => chart.instance.total[0]),
		driveChart.getChart('hour', 1).then(chart => chart.local.totalSize[0]),
		driveChart.getChart('hour', 1).then(chart => chart.remote.totalSize[0]),
	]);

	return {
		notesCount,
		originalNotesCount,
		usersCount,
		originalUsersCount,
		instances,
		driveUsageLocal,
		driveUsageRemote
	};
});

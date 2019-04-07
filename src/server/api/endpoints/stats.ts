import define from '../define';
import { Notes, Users } from '../../../models';
import { federationChart, driveChart } from '../../../services/chart';

export const meta = {
	requireCredential: false,

	desc: {
		'en-US': 'Get the instance\'s statistics'
	},

	tags: ['meta'],

	params: {
	},

	res: {
		type: 'object',
		properties: {
			notesCount: {
				type: 'number',
				description: 'The count of all (local/remote) notes of this instance.',
			},
			originalNotesCount: {
				type: 'number',
				description: 'The count of all local notes of this instance.',
			},
			usersCount: {
				type: 'number',
				description: 'The count of all (local/remote) accounts of this instance.',
			},
			originalUsersCount: {
				type: 'number',
				description: 'The count of all local accounts of this instance.',
			},
			instances: {
				type: 'number',
				description: 'The count of federated instances.',
			},
		}
	}
};

export default define(meta, async () => {
	const [notesCount, originalNotesCount, usersCount, originalUsersCount, instances, driveUsageLocal, driveUsageRemote] = await Promise.all([
		Notes.count(),
		Notes.count({ userHost: null }),
		Users.count(),
		Users.count({ host: null }),
		federationChart.getChart('hour', 1).then(chart => chart.instance.total[0]),
		driveChart.getChart('hour', 1).then(chart => chart.local.totalSize[0]),
		driveChart.getChart('hour', 1).then(chart => chart.remote.totalSize[0]),
	]);

	return {
		notesCount, originalNotesCount, usersCount, originalUsersCount, instances, driveUsageLocal, driveUsageRemote
	};
});

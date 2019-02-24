import define from '../define';
import driveChart from '../../../services/chart/drive';
import federationChart from '../../../services/chart/federation';
import fetchMeta from '../../../misc/fetch-meta';

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
	const instance = await fetchMeta();

	const stats: any = instance.stats;

	const driveStats = await driveChart.getChart('hour', 1);
	stats.driveUsageLocal = driveStats.local.totalSize[0];
	stats.driveUsageRemote = driveStats.remote.totalSize[0];

	const federationStats = await federationChart.getChart('hour', 1);
	stats.instances = federationStats.instance.total[0];

	return stats;
});

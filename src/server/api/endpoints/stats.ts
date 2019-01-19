import define from '../define';
import driveChart from '../../../chart/drive';
import federationChart from '../../../chart/federation';
import fetchMeta from '../../../misc/fetch-meta';

export const meta = {
	requireCredential: false,

	desc: {
		'en-US': 'Get the instance\'s statistics'
	},

	params: {
	}
};

export default define(meta, () => fetchMeta()
	.then(({ stats }) => driveChart.getChart('hour', 1)
		.then(({ local, remote }) => federationChart.getChart('hour', 1)
			.then(({ instance }) => ({ ...stats,
					driveUsageLocal: local.totalSize[0],
					driveUsageRemote: remote.totalSize[0],
					instances: instance.total[0]
				})))));

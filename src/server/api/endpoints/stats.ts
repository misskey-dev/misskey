import Meta from '../../../models/meta';
import define from '../define';
import driveChart from '../../../chart/drive';
import federationChart from '../../../chart/federation';

export const meta = {
	requireCredential: false,

	desc: {
		'en-US': 'Get the instance\'s statistics'
	},

	params: {
	}
};

export default define(meta, () => new Promise(async (res, rej) => {
	const meta = await Meta.findOne();

	const stats: any = meta ? meta.stats : {};

	const driveStats = await driveChart.getChart('hour', 1);
	stats.driveUsageLocal = driveStats.local.totalSize[0];
	stats.driveUsageRemote = driveStats.remote.totalSize[0];

	console.log(driveStats);

	const federationStats = await federationChart.getChart('hour', 1);
	stats.instances = federationStats.instance.total[0];

	res(stats);
}));

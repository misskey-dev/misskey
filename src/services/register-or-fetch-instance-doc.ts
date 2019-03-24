import federationChart from './chart/charts/federation';
import { Instance } from '../models/entities/instance';
import { Instances } from '../models';

export async function registerOrFetchInstanceDoc(host: string): Promise<Instance> {
	if (host == null) return null;

	const index = await Instances.findOne({ host });

	if (index == null) {
		const i = await Instances.save({
			host,
			caughtAt: new Date(),
			system: null // TODO
		});

		federationChart.update(true);

		return i;
	} else {
		return index;
	}
}

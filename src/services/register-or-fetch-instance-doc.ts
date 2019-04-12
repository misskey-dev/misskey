import Instance, { IInstance } from '../models/instance';
import federationChart from '../services/chart/federation';
import { toDbHost } from '../misc/convert-host';

export async function registerOrFetchInstanceDoc(host: string): Promise<IInstance> {
	if (host == null) return null;

	host = toDbHost(host);

	const index = await Instance.findOne({ host });

	if (index == null) {
		const i = await Instance.insert({
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

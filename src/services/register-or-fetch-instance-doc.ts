import { Instance } from '../models/entities/instance';
import { Instances } from '../models';
import { federationChart } from './chart';
import { genId } from '../misc/gen-id';
import { toPuny } from '../misc/convert-host';
import { Cache } from '../misc/cache';

const cache = new Cache<Instance>(1000 * 60 * 60);

export async function registerOrFetchInstanceDoc(host: string): Promise<Instance> {
	host = toPuny(host);

	const cached = cache.get(host);
	if (cached) return cached;

	const index = await Instances.findOne({ host });

	if (index == null) {
		const i = await Instances.save({
			id: genId(),
			host,
			caughtAt: new Date(),
			lastCommunicatedAt: new Date(),
		});

		federationChart.update(true);

		cache.set(host, i);
		return i;
	} else {
		cache.set(host, index);
		return index;
	}
}

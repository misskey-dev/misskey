import { Instance } from '@/models/entities/instance.js';
import { Instances } from '@/models/index.js';
import { genId } from '@/misc/gen-id.js';
import { toPuny } from '@/misc/convert-host.js';
import { Cache } from '@/misc/cache.js';

const cache = new Cache<Instance>(1000 * 60 * 60);

export async function registerOrFetchInstanceDoc(host: string): Promise<Instance> {
	host = toPuny(host);

	const cached = cache.get(host);
	if (cached) return cached;

	const index = await Instances.findOneBy({ host });

	if (index == null) {
		const i = await Instances.insert({
			id: genId(),
			host,
			caughtAt: new Date(),
			lastCommunicatedAt: new Date(),
		}).then(x => Instances.findOneByOrFail(x.identifiers[0]));

		cache.set(host, i);
		return i;
	} else {
		cache.set(host, index);
		return index;
	}
}

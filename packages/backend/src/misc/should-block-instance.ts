import { DataSource } from 'typeorm';
import { fetchMeta } from '@/misc/fetch-meta.js';
import type { MiInstance } from '@/models/Instance.js';
import type { MiMeta } from '@/models/Meta.js';

export async function shouldSilenceInstance(
	host: MiInstance['host'],
	db : DataSource,
	meta?: MiMeta,
): Promise<boolean> {
	const { silencedHosts } = meta ?? (await fetchMeta(true, db));
	return silencedHosts.some(
		(limitedHost: string) => host === limitedHost || host.endsWith(`.${limitedHost}`),
	);
}

import { DataSource } from 'typeorm';
import { MiMeta } from '@/models/Meta.js';

let cache: MiMeta;

export async function fetchMeta(noCache = false, db: DataSource): Promise<MiMeta> {
	if (!noCache && cache) return cache;

	return await db.transaction(async (transactionalEntityManager) => {
		// New IDs are prioritized because multiple records may have been created due to past bugs.
		const metas = await transactionalEntityManager.find(MiMeta, {
			order: {
				id: 'DESC',
			},
		});

		const meta = metas[0];

		if (meta) {
			cache = meta;
			return meta;
		} else {
			// If fetchMeta is called at the same time when meta is empty, this part may be called at the same time, so use fail-safe upsert.
			const saved = await transactionalEntityManager
				.upsert(
					MiMeta,
					{
						id: 'x',
					},
					['id'],
				)
				.then((x) =>
					transactionalEntityManager.findOneByOrFail(MiMeta, x.identifiers[0]),
				);

			cache = saved;
			return saved;
		}
	});
}

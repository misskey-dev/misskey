import { db } from '@/db/postgre.js';
import { Meta } from '@/models/entities/meta.js';

let cache: Meta;

export async function fetchMeta(noCache = false): Promise<Meta> {
	if (!noCache && cache) return cache;

	return await db.transaction(async transactionalEntityManager => {
		// 過去のバグでレコードが複数出来てしまっている可能性があるので新しいIDを優先する
		const metas = await transactionalEntityManager.find(Meta, {
			order: {
				id: 'DESC',
			},
		});

		const meta = metas[0];

		if (meta) {
			cache = meta;
			return meta;
		} else {
			// metaが空のときfetchMetaが同時に呼ばれるとここが同時に呼ばれてしまうことがあるのでフェイルセーフなupsertを使う
			const saved = await transactionalEntityManager
				.upsert(
					Meta,
					{
						id: 'x',
					},
					['id'],
				)
				.then((x) => transactionalEntityManager.findOneByOrFail(Meta, x.identifiers[0]));

			cache = saved;
			return saved;
		}
	});
}

setInterval(() => {
	fetchMeta(true).then(meta => {
		cache = meta;
	});
}, 1000 * 10);

import { Inject, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import type { Users } from '@/models/index.js';
import { DI } from '@/di-symbols.js';
import { Meta } from '@/models/entities/Meta.js';
import type { OnApplicationShutdown } from '@nestjs/common';

@Injectable()
export class MetaService implements OnApplicationShutdown {
	#cache: Meta | undefined;
	#intervalId: NodeJS.Timer;

	constructor(
		@Inject(DI.db)
		private db: DataSource,

		@Inject('usersRepository')
		private usersRepository: typeof Users,
	) {
		if (process.env.NODE_ENV !== 'test') {
			this.#intervalId = setInterval(() => {
				this.fetch(true).then(meta => {
					this.#cache = meta;
				});
			}, 1000 * 10);
		}
	}

	async fetch(noCache = false): Promise<Meta> {
		if (!noCache && this.#cache) return this.#cache;
	
		return await this.db.transaction(async transactionalEntityManager => {
			// 過去のバグでレコードが複数出来てしまっている可能性があるので新しいIDを優先する
			const metas = await transactionalEntityManager.find(Meta, {
				order: {
					id: 'DESC',
				},
			});
	
			const meta = metas[0];
	
			if (meta) {
				this.#cache = meta;
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
	
				this.#cache = saved;
				return saved;
			}
		});
	}
	
	public onApplicationShutdown(signal?: string | undefined) {
		clearInterval(this.#intervalId);
	}
}

/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { DI } from '@/di-symbols.js';
import type { MiRegistryItem, RegistryItemsRepository } from '@/models/_.js';
import { IdentifiableError } from '@/misc/identifiable-error.js';
import type { MiUser } from '@/models/User.js';
import { IdService } from '@/core/IdService.js';
import { GlobalEventService } from '@/core/GlobalEventService.js';
import { bindThis } from '@/decorators.js';

@Injectable()
export class RegistryApiService {
	constructor(
		@Inject(DI.registryItemsRepository)
		private registryItemsRepository: RegistryItemsRepository,

		private idService: IdService,
		private globalEventService: GlobalEventService,
	) {
	}

	@bindThis
	public async set(userId: MiUser['id'], domain: string | null, scope: string[], key: string, value: any) {
		// TODO: 作成できるキーの数を制限する

		const query = this.registryItemsRepository.createQueryBuilder('item');
		if (domain) {
			query.where('item.domain = :domain', { domain: domain });
		} else {
			query.where('item.domain IS NULL');
		}
		query.andWhere('item.userId = :userId', { userId: userId });
		query.andWhere('item.key = :key', { key: key });
		query.andWhere('item.scope = :scope', { scope: scope });

		const existingItem = await query.getOne();

		if (existingItem) {
			await this.registryItemsRepository.update(existingItem.id, {
				updatedAt: new Date(),
				value: value,
			});
		} else {
			await this.registryItemsRepository.insert({
				id: this.idService.gen(),
				updatedAt: new Date(),
				userId: userId,
				domain: domain,
				scope: scope,
				key: key,
				value: value,
			});
		}

		if (domain == null) {
			// TODO: サードパーティアプリが傍受出来てしまうのでどうにかする
			this.globalEventService.publishMainStream(userId, 'registryUpdated', {
				scope: scope,
				key: key,
				value: value,
			});
		}
	}

	@bindThis
	public async getItem(userId: MiUser['id'], domain: string | null, scope: string[], key: string): Promise<MiRegistryItem | null> {
		const query = this.registryItemsRepository.createQueryBuilder('item')
			.where(domain == null ? 'item.domain IS NULL' : 'item.domain = :domain', { domain: domain })
			.andWhere('item.userId = :userId', { userId: userId })
			.andWhere('item.key = :key', { key: key })
			.andWhere('item.scope = :scope', { scope: scope });

		const item = await query.getOne();

		return item;
	}

	@bindThis
	public async getAllItemsOfScope(userId: MiUser['id'], domain: string | null, scope: string[]): Promise<MiRegistryItem[]> {
		const query = this.registryItemsRepository.createQueryBuilder('item');
		query.where(domain == null ? 'item.domain IS NULL' : 'item.domain = :domain', { domain: domain });
		query.andWhere('item.userId = :userId', { userId: userId });
		query.andWhere('item.scope = :scope', { scope: scope });

		const items = await query.getMany();

		return items;
	}

	@bindThis
	public async getAllKeysOfScope(userId: MiUser['id'], domain: string | null, scope: string[]): Promise<string[]> {
		const query = this.registryItemsRepository.createQueryBuilder('item');
		query.select('item.key');
		query.where(domain == null ? 'item.domain IS NULL' : 'item.domain = :domain', { domain: domain });
		query.andWhere('item.userId = :userId', { userId: userId });
		query.andWhere('item.scope = :scope', { scope: scope });

		const items = await query.getMany();

		return items.map(x => x.key);
	}

	@bindThis
	public async getAllScopeAndDomains(userId: MiUser['id']): Promise<{ domain: string | null; scopes: string[][] }[]> {
		const query = this.registryItemsRepository.createQueryBuilder('item')
			.select(['item.scope', 'item.domain'])
			.where('item.userId = :userId', { userId: userId });

		const items = await query.getMany();

		const res = [] as { domain: string | null; scopes: string[][] }[];

		for (const item of items) {
			const target = res.find(x => x.domain === item.domain);
			if (target) {
				if (target.scopes.some(scope => scope.join('.') === item.scope.join('.'))) continue;
				target.scopes.push(item.scope);
			} else {
				res.push({
					domain: item.domain,
					scopes: [item.scope],
				});
			}
		}

		return res;
	}

	@bindThis
	public async remove(userId: MiUser['id'], domain: string | null, scope: string[], key: string) {
		const query = this.registryItemsRepository.createQueryBuilder().delete();
		if (domain) {
			query.where('domain = :domain', { domain: domain });
		} else {
			query.where('domain IS NULL');
		}
		query.andWhere('userId = :userId', { userId: userId });
		query.andWhere('key = :key', { key: key });
		query.andWhere('scope = :scope', { scope: scope });

		await query.execute();
	}
}

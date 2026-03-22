/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DI } from '@/di-symbols.js';
import type { NoctownWorldChunksRepository, NoctownWorldsRepository } from '@/models/_.js';
import { IdService } from '@/core/IdService.js';
import { getChunkGenerator } from '@/misc/noctown/chunk-generator.js';

export const meta = {
	tags: ['noctown'],

	requireCredential: true,
	kind: 'read:account',

	res: {
		type: 'object',
		optional: false, nullable: false,
		properties: {
			chunkX: { type: 'number' },
			chunkZ: { type: 'number' },
			terrainData: { type: 'object' },
			biome: { type: 'string' },
		},
	},

	errors: {
		worldNotFound: {
			message: 'World not found.',
			code: 'WORLD_NOT_FOUND',
			id: 'c9a8b7c6-2345-6789-abcd-ef0123456789',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		chunkX: { type: 'integer' },
		chunkZ: { type: 'integer' },
	},
	required: ['chunkX', 'chunkZ'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.noctownWorldsRepository)
		private noctownWorldsRepository: NoctownWorldsRepository,

		@Inject(DI.noctownWorldChunksRepository)
		private noctownWorldChunksRepository: NoctownWorldChunksRepository,

		private idService: IdService,
	) {
		super(meta, paramDef, async (ps, me) => {
			// Get or create world
			let world = await this.noctownWorldsRepository.findOne({
				where: {},
				order: { createdAt: 'ASC' },
			});

			if (!world) {
				// Create default world
				const seedValue = Math.floor(Math.random() * 2147483647).toString();
				await this.noctownWorldsRepository.insert({
					id: this.idService.gen(),
					seed: seedValue,
				});
				world = await this.noctownWorldsRepository.findOneByOrFail({});
			}

			// Get or create chunk
			let chunk = await this.noctownWorldChunksRepository.findOneBy({
				worldId: world.id,
				chunkX: ps.chunkX,
				chunkZ: ps.chunkZ,
			});

			if (!chunk) {
				// Generate chunk terrain data using Perlin noise generator
				const seedNum = parseInt(world.seed, 10);
				const generator = getChunkGenerator(seedNum);
				const terrainData = generator.generateChunk(ps.chunkX, ps.chunkZ);

				// Use query builder to bypass type issues with jsonb column
				await this.noctownWorldChunksRepository
					.createQueryBuilder()
					.insert()
					.values({
						id: this.idService.gen(),
						worldId: world.id,
						chunkX: ps.chunkX,
						chunkZ: ps.chunkZ,
						terrainData: () => `'${JSON.stringify(terrainData)}'::jsonb`,
						biome: terrainData.biome,
					})
					.execute();

				chunk = await this.noctownWorldChunksRepository.findOneBy({
					worldId: world.id,
					chunkX: ps.chunkX,
					chunkZ: ps.chunkZ,
				});
			}

			if (!chunk) {
				throw new Error('Failed to create or retrieve chunk');
			}

			return {
				chunkX: chunk.chunkX,
				chunkZ: chunk.chunkZ,
				terrainData: chunk.terrainData,
				biome: chunk.biome,
			};
		});
	}
}

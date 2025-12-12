/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Entity, Column, PrimaryColumn, Index, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { id } from '../util/id.js';
import { NoctownWorld } from './NoctownWorld.js';

@Entity('noctown_world_chunk')
@Unique(['worldId', 'chunkX', 'chunkZ'])
export class NoctownWorldChunk {
	@PrimaryColumn(id())
	public id: string;

	@Index()
	@Column({
		...id(),
		comment: 'World reference',
	})
	public worldId: NoctownWorld['id'];

	@ManyToOne(() => NoctownWorld, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public world: NoctownWorld | null;

	@Column('integer', {
		comment: 'Chunk X coordinate',
	})
	public chunkX: number;

	@Column('integer', {
		comment: 'Chunk Z coordinate',
	})
	public chunkZ: number;

	@Column('jsonb', {
		comment: 'Terrain data',
	})
	public terrainData: Record<string, unknown>;

	@Column('varchar', {
		length: 64,
		default: 'plains',
		comment: 'Biome type',
	})
	public biome: string;

	@Column('timestamp with time zone', {
		default: () => 'CURRENT_TIMESTAMP',
		comment: 'Generated timestamp',
	})
	public generatedAt: Date;
}

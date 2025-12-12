/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Entity, Column, PrimaryColumn } from 'typeorm';
import { id } from '../util/id.js';

export const interiorMapTypes = [
	'shop',
	'inn',
	'house',
	'guild',
	'barn',
	'tower',
	'custom',
] as const;

export type InteriorMapType = typeof interiorMapTypes[number];

export interface InteriorTile {
	type: 'floor' | 'wall' | 'door' | 'counter' | 'furniture' | 'empty';
	variant: number;
}

export interface InteriorNpc {
	id: string;
	type: 'shopkeeper' | 'innkeeper' | 'guild_master' | 'quest_giver';
	positionX: number;
	positionZ: number;
}

export interface InteriorFurniture {
	id: string;
	itemId: string;
	positionX: number;
	positionZ: number;
	rotation: number;
}

@Entity('noctown_interior_map')
export class NoctownInteriorMap {
	@PrimaryColumn(id())
	public id: string;

	@Column('varchar', {
		length: 128,
		comment: 'Interior ID (matches building interiorId)',
	})
	public interiorId: string;

	@Column('varchar', {
		length: 32,
		comment: 'Interior type',
	})
	public type: InteriorMapType;

	@Column('varchar', {
		length: 128,
		comment: 'Display name',
	})
	public name: string;

	@Column('smallint', {
		comment: 'Interior width (tiles)',
	})
	public width: number;

	@Column('smallint', {
		comment: 'Interior depth (tiles)',
	})
	public depth: number;

	@Column('jsonb', {
		comment: 'Tile layout (2D array)',
	})
	public tiles: InteriorTile[][];

	@Column('jsonb', {
		default: '[]',
		comment: 'NPCs in this interior',
	})
	public npcs: InteriorNpc[];

	@Column('jsonb', {
		default: '[]',
		comment: 'Furniture in this interior',
	})
	public furniture: InteriorFurniture[];

	@Column('smallint', {
		default: 0,
		comment: 'Entry point X coordinate',
	})
	public entryX: number;

	@Column('smallint', {
		default: 0,
		comment: 'Entry point Z coordinate',
	})
	public entryZ: number;

	@Column('timestamp with time zone', {
		default: () => 'CURRENT_TIMESTAMP',
		comment: 'Created timestamp',
	})
	public createdAt: Date;
}

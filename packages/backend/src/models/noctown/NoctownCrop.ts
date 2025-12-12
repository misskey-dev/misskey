/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Entity, Column, PrimaryColumn, Index, ManyToOne, JoinColumn } from 'typeorm';
import { id } from '../util/id.js';
import { NoctownFarmPlot } from './NoctownFarmPlot.js';
import { NoctownItem } from './NoctownItem.js';

export const noctownCropStages = [
	'seed',
	'sprout',
	'growing',
	'mature',
	'harvestable',
	'withered',
] as const;

export type NoctownCropStage = typeof noctownCropStages[number];

@Entity('noctown_crop')
export class NoctownCrop {
	@PrimaryColumn(id())
	public id: string;

	@Index()
	@Column({
		...id(),
		comment: 'Farm plot ID',
	})
	public plotId: NoctownFarmPlot['id'];

	@ManyToOne(() => NoctownFarmPlot, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public plot: NoctownFarmPlot | null;

	@Column({
		...id(),
		comment: 'Seed item ID',
	})
	public seedItemId: NoctownItem['id'];

	@ManyToOne(() => NoctownItem, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public seedItem: NoctownItem | null;

	@Column('varchar', {
		length: 32,
		default: 'seed',
		comment: 'Growth stage',
	})
	public stage: NoctownCropStage;

	@Column('smallint', {
		default: 0,
		comment: 'Water level (0-100)',
	})
	public waterLevel: number;

	@Column('smallint', {
		default: 0,
		comment: 'Growth progress (0-100)',
	})
	public growthProgress: number;

	@Column('timestamp with time zone', {
		default: () => 'CURRENT_TIMESTAMP',
		comment: 'Planted timestamp',
	})
	public plantedAt: Date;

	@Column('timestamp with time zone', {
		nullable: true,
		comment: 'Last watered timestamp',
	})
	public lastWateredAt: Date | null;
}

/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Entity, Column, PrimaryColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { id } from '../util/id.js';
import { NoctownItem } from './NoctownItem.js';

@Entity('noctown_recipe')
export class NoctownRecipe {
	@PrimaryColumn(id())
	public id: string;

	@Column('varchar', {
		length: 128,
		comment: 'Recipe name',
	})
	public name: string;

	@Column('text', {
		nullable: true,
		comment: 'Recipe description',
	})
	public description: string | null;

	@Column({
		...id(),
		comment: 'Result item ID',
	})
	public resultItemId: NoctownItem['id'];

	@ManyToOne(() => NoctownItem, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public resultItem: NoctownItem | null;

	@Column('smallint', {
		default: 1,
		comment: 'Result quantity',
	})
	public resultQuantity: number;

	@Column('smallint', {
		default: 0,
		comment: 'Required crafting level (0 = no requirement)',
	})
	public requiredLevel: number;

	@Column('boolean', {
		default: false,
		comment: 'Whether recipe needs to be unlocked',
	})
	public isLocked: boolean;

	@Column('varchar', {
		length: 32,
		default: 'normal',
		comment: 'Recipe category (normal, equipment, consumable, decoration)',
	})
	public category: string;

	@Column('integer', {
		default: 0,
		comment: 'Crafting time in seconds (0 = instant)',
	})
	public craftingTime: number;

	@Column('integer', {
		default: 0,
		comment: 'Crafting cost in currency (0 = free)',
	})
	public craftingCost: number;

	@Column('timestamp with time zone', {
		default: () => 'CURRENT_TIMESTAMP',
		comment: 'Created timestamp',
	})
	public createdAt: Date;
}

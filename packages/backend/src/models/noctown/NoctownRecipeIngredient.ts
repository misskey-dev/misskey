/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Entity, Column, PrimaryColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { id } from '../util/id.js';
import { NoctownRecipe } from './NoctownRecipe.js';
import { NoctownItem } from './NoctownItem.js';

@Entity('noctown_recipe_ingredient')
@Index(['recipeId', 'itemId'], { unique: true })
export class NoctownRecipeIngredient {
	@PrimaryColumn(id())
	public id: string;

	@Column({
		...id(),
		comment: 'Recipe reference',
	})
	public recipeId: NoctownRecipe['id'];

	@ManyToOne(() => NoctownRecipe, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public recipe: NoctownRecipe | null;

	@Column({
		...id(),
		comment: 'Required item ID',
	})
	public itemId: NoctownItem['id'];

	@ManyToOne(() => NoctownItem, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public item: NoctownItem | null;

	@Column('smallint', {
		default: 1,
		comment: 'Required quantity',
	})
	public quantity: number;

	@Column('boolean', {
		default: true,
		comment: 'Whether item is consumed in crafting',
	})
	public isConsumed: boolean;
}

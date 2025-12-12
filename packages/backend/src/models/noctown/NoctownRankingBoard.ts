/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Entity, Column, PrimaryColumn, Index } from 'typeorm';
import { id } from '../util/id.js';

export const rankingCategories = [
	'total',      // Total combined score
	'balance',    // Wallet balance
	'item',       // Item collection score
	'quest',      // Quest completion score
	'speed',      // Speed/efficiency score
	'farming',    // Farming score
	'livestock',  // Livestock score
	'crafting',   // Crafting score
	'trading',    // Trading score
] as const;

export type RankingCategory = typeof rankingCategories[number];

@Entity('noctown_ranking_board')
@Index(['category', 'rank'])
@Index(['playerId', 'category'])
@Index(['updatedAt'])
export class NoctownRankingBoard {
	@PrimaryColumn(id())
	public id: string;

	@Column('varchar', {
		length: 32,
		comment: 'Ranking category',
	})
	public category: RankingCategory;

	@Column({
		...id(),
		comment: 'Player ID',
	})
	public playerId: string;

	@Column('integer', {
		comment: 'Rank position (1 = first place)',
	})
	public rank: number;

	@Column('bigint', {
		comment: 'Score value',
	})
	public score: string; // Use string for bigint

	@Column('bigint', {
		nullable: true,
		comment: 'Previous rank (for rank change tracking)',
	})
	public previousRank: number | null;

	@Column('bigint', {
		nullable: true,
		comment: 'Previous score',
	})
	public previousScore: string | null;

	@Column('integer', {
		default: 0,
		comment: 'Rank change since last update (+1 = moved up)',
	})
	public rankChange: number;

	@Column('timestamp with time zone', {
		default: () => 'CURRENT_TIMESTAMP',
		comment: 'Last updated timestamp',
	})
	public updatedAt: Date;

	@Column('timestamp with time zone', {
		default: () => 'CURRENT_TIMESTAMP',
		comment: 'Created timestamp',
	})
	public createdAt: Date;
}

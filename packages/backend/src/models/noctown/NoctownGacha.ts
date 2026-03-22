/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Entity, Column, PrimaryColumn, Index } from 'typeorm';
import { id } from '../util/id.js';

@Entity('noctown_gacha')
@Index(['isActive'])
export class NoctownGacha {
	@PrimaryColumn(id())
	public id: string;

	@Column('varchar', {
		length: 128,
		comment: 'Gacha machine name',
	})
	public name: string;

	@Column('text', {
		nullable: true,
		comment: 'Gacha description',
	})
	public description: string | null;

	@Column('integer', {
		default: 100,
		comment: 'Cost per pull (in coins)',
	})
	public costPerPull: number;

	@Column('boolean', {
		default: true,
		comment: 'Is gacha active',
	})
	public isActive: boolean;

	@Column('real', {
		nullable: true,
		comment: 'X position in world (if placed)',
	})
	public positionX: number | null;

	@Column('real', {
		nullable: true,
		comment: 'Z position in world (if placed)',
	})
	public positionZ: number | null;

	@Column('timestamp with time zone', {
		nullable: true,
		comment: 'Start date (null = always available)',
	})
	public startDate: Date | null;

	@Column('timestamp with time zone', {
		nullable: true,
		comment: 'End date (null = no end)',
	})
	public endDate: Date | null;

	@Column('integer', {
		nullable: true,
		comment: 'Max pulls per player (null = unlimited)',
	})
	public maxPullsPerPlayer: number | null;

	@Column('varchar', {
		length: 32,
		default: 'standard',
		comment: 'Gacha type (standard, limited, premium)',
	})
	public gachaType: string;

	@Column('timestamp with time zone', {
		default: () => 'CURRENT_TIMESTAMP',
		comment: 'Created timestamp',
	})
	public createdAt: Date;
}

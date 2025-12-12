/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Entity, Column, PrimaryColumn } from 'typeorm';
import { id } from '../util/id.js';

@Entity('noctown_world')
export class NoctownWorld {
	@PrimaryColumn(id())
	public id: string;

	@Column('bigint', {
		comment: 'Map generation seed',
	})
	public seed: string; // bigint is stored as string in TypeORM

	@Column('timestamp with time zone', {
		default: () => 'CURRENT_TIMESTAMP',
		comment: 'Created timestamp',
	})
	public createdAt: Date;
}

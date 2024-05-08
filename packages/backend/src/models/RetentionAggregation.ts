/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Entity, PrimaryColumn, Index, Column } from 'typeorm';
import { id } from './util/id.js';
import type { MiUser } from './User.js';

@Entity('retention_aggregation')
export class MiRetentionAggregation {
	@PrimaryColumn(id())
	public id: string;

	@Index()
	@Column('timestamp with time zone', {
		comment: 'The created date of the Note.',
	})
	public createdAt: Date;

	@Column('timestamp with time zone', {
		comment: 'The updated date of the GalleryPost.',
	})
	public updatedAt: Date;

	@Index({ unique: true })
	@Column('varchar', {
		length: 512, nullable: false,
	})
	public dateKey: string;

	@Column({
		...id(),
		array: true,
	})
	public userIds: MiUser['id'][];

	@Column('integer', {
	})
	public usersCount: number;

	@Column('jsonb', {
		default: {},
	})
	public data: Record<string, number>;
}

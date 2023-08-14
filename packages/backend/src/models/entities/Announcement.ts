/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Entity, Index, Column, PrimaryColumn } from 'typeorm';
import { id } from '../id.js';

@Entity()
export class Announcement {
	@PrimaryColumn(id())
	public id: string;

	@Index()
	@Column('timestamp with time zone', {
		comment: 'The created date of the Announcement.',
	})
	public createdAt: Date;

	@Column('timestamp with time zone', {
		comment: 'The updated date of the Announcement.',
		nullable: true,
	})
	public updatedAt: Date | null;

	@Column('varchar', {
		length: 8192, nullable: false,
	})
	public text: string;

	@Column('varchar', {
		length: 256, nullable: false,
	})
	public title: string;

	@Column('varchar', {
		length: 1024, nullable: true,
	})
	public imageUrl: string | null;

	// UIに表示する際の並び順用(大きいほど先頭)
	@Index()
	@Column('integer', {
		default: 0,
	})
	public displayOrder: number;

	@Index()
	@Column('varchar', {
		...id(),
		nullable: true,
	})
	public userId: string | null;

	@Column('integer', {
		nullable: false,
		default: 0,
	})
	public closeDuration: number;

	constructor(data: Partial<Announcement>) {
		if (data == null) return;

		for (const [k, v] of Object.entries(data)) {
			(this as any)[k] = v;
		}
	}
}

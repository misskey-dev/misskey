/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { PrimaryColumn, Entity, Index, Column } from 'typeorm';
import { id } from './util/id.js';

@Entity('relay')
export class MiRelay {
	@PrimaryColumn(id())
	public id: string;

	@Index({ unique: true })
	@Column('varchar', {
		length: 512, nullable: false,
	})
	public inbox: string;

	@Column('enum', {
		enum: ['requesting', 'accepted', 'rejected'],
	})
	public status: 'requesting' | 'accepted' | 'rejected';
}

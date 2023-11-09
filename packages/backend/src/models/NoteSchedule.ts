/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Entity, Index, JoinColumn, Column, PrimaryColumn, ManyToOne } from 'typeorm';
import type { MiNoteCreateOption } from '@/types.js';
import { id } from './util/id.js';
import { MiUser } from './User.js';

@Entity('note_schedule')
export class MiNoteSchedule {
	@PrimaryColumn(id())
	public id: string;

	@Column('jsonb')
	public note: MiNoteCreateOption;

	@Index()
	@Column('varchar', {
		length: 260,
	})
	public userId: MiUser['id'];

	@Column('timestamp with time zone')
	public expiresAt: Date;
}

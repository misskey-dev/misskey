/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { PrimaryColumn, Entity, Index, JoinColumn, Column, OneToOne } from 'typeorm';
import { id } from '../id.js';
import { Note } from './Note.js';
import type { User } from './User.js';

@Entity()
export class PromoNote {
	@PrimaryColumn(id())
	public noteId: Note['id'];

	@OneToOne(type => Note, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public note: Note | null;

	@Column('timestamp with time zone')
	public expiresAt: Date;

	//#region Denormalized fields
	@Index()
	@Column({
		...id(),
		comment: '[Denormalized]',
	})
	public userId: User['id'];
	//#endregion
}

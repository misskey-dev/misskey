/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { PrimaryColumn, Entity, Index, JoinColumn, Column, OneToOne } from 'typeorm';
import { id } from './util/id.js';
import { MiNote } from './Note.js';
import type { MiUser } from './User.js';

@Entity('promo_note')
export class MiPromoNote {
	@PrimaryColumn(id())
	public noteId: MiNote['id'];

	@OneToOne(type => MiNote, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public note: MiNote | null;

	@Column('timestamp with time zone')
	public expiresAt: Date;

	//#region Denormalized fields
	@Index()
	@Column({
		...id(),
		comment: '[Denormalized]',
	})
	public userId: MiUser['id'];
	//#endregion
}

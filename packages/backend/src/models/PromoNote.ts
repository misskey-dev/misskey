/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Column, Entity, Index, JoinColumn, OneToOne, PrimaryColumn } from 'typeorm';
import { MiNote } from './Note.js';
import type { MiUser } from './User.js';
import { id } from './util/id.js';

@Entity('promo_note')
export class MiPromoNote {
	@PrimaryColumn(id())
	public noteId: MiNote['id'];

	@OneToOne(() => MiNote, {
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

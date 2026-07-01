/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { PrimaryColumn, Entity, Index, JoinColumn, Column, ManyToOne } from 'typeorm';
import { id } from './util/id.js';
import { MiUser } from './User.js';
import { MiNote } from './Note.js';

@Entity('note_sp_reaction')
@Index(['userId', 'noteId'], { unique: true })
export class MiNoteSpReaction {
	@PrimaryColumn(id())
	public id: string;

	@Index()
	@Column(id())
	public userId: MiUser['id'];

	@ManyToOne(() => MiUser, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public user?: MiUser | null;

	@Index()
	@Column(id())
	public noteId: MiNote['id'];

	@ManyToOne(() => MiNote, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public note?: MiNote | null;

	@Column('varchar', {
		length: 260,
	})
	public reaction: string;

	//#region Denormalized fields
	@Index()
	@Column({
		...id(),
		comment: '[Denormalized]',
	})
	public noteUserId: MiUser['id'];
	//#endregion
}

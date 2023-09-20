/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Entity, Index, JoinColumn, Column, ManyToOne, PrimaryColumn } from 'typeorm';
import { mutedNoteReasons } from '@/types.js';
import { id } from './util/id.js';
import { MiNote } from './Note.js';
import { MiUser } from './User.js';

@Entity('muted_note')
@Index(['noteId', 'userId'], { unique: true })
export class MiMutedNote {
	@PrimaryColumn(id())
	public id: string;

	@Index()
	@Column({
		...id(),
		comment: 'The note ID.',
	})
	public noteId: MiNote['id'];

	@ManyToOne(type => MiNote, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public note: MiNote | null;

	@Index()
	@Column({
		...id(),
		comment: 'The user ID.',
	})
	public userId: MiUser['id'];

	@ManyToOne(type => MiUser, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public user: MiUser | null;

	/**
	 * ミュートされた理由。
	 */
	@Index()
	@Column('enum', {
		enum: mutedNoteReasons,
		comment: 'The reason of the MutedNote.',
	})
	public reason: typeof mutedNoteReasons[number];
}

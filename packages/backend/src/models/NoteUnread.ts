/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { PrimaryColumn, Entity, Index, JoinColumn, Column, ManyToOne } from 'typeorm';
import { id } from './util/id.js';
import { MiUser } from './User.js';
import { MiNote } from './Note.js';
import type { MiChannel } from './Channel.js';

@Entity('note_unread')
@Index(['userId', 'noteId'], { unique: true })
export class MiNoteUnread {
	@PrimaryColumn(id())
	public id: string;

	@Index()
	@Column(id())
	public userId: MiUser['id'];

	@ManyToOne(type => MiUser, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public user: MiUser | null;

	@Index()
	@Column(id())
	public noteId: MiNote['id'];

	@ManyToOne(type => MiNote, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public note: MiNote | null;

	/**
	 * メンションか否か
	 */
	@Index()
	@Column('boolean')
	public isMentioned: boolean;

	/**
	 * ダイレクト投稿か否か
	 */
	@Index()
	@Column('boolean')
	public isSpecified: boolean;

	//#region Denormalized fields
	@Index()
	@Column({
		...id(),
		comment: '[Denormalized]',
	})
	public noteUserId: MiUser['id'];

	@Index()
	@Column({
		...id(),
		nullable: true,
		comment: '[Denormalized]',
	})
	public noteChannelId: MiChannel['id'] | null;
	//#endregion
}

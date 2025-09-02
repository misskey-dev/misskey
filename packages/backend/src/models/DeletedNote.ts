/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Entity, Index, JoinColumn, Column, PrimaryColumn, ManyToOne } from 'typeorm';
import { MiChannel } from '@/models/Channel.js';
import { id } from './util/id.js';
import { MiUser } from './User.js';
import { MiNote } from './Note.js';

/**
 * This model represents a deleted note in the Misskey system.
 * Deleted note can be one of:
 * - A note that was deleted by the user.
 * - A remote note that is old and has been removed from the
 * In both cases, we want to keep little information about the note to allow users to
 * - see the reply / renote relationships of the note (if the note is in the reply / renote chain)
 * - see the original url of the note if the note was remote
 */

@Index(['userId', 'id']) // Note: this index is ("userId", "id" DESC) in production, but not in test.
@Entity('deleted_note')
export class MiDeletedNote {
	// The id of the note must be same as the original note's id.
	@PrimaryColumn(id())
	public id: string;

	// For remote notes that are deleted locally but not deleted on the remote server, this will be null.
	// For actually deleted notes, this will be the time when the note was deleted.
	@Column('timestamp with time zone', {
		nullable: true,
	})
	public deletedAt: Date | null;

	@Index()
	@Column({
		...id(),
		nullable: true,
		comment: 'The ID of reply target.',
	})
	public replyId: MiNote['id'] | null;

	@ManyToOne(type => MiNote, {
		createForeignKeyConstraints: false,
	})
	@JoinColumn()
	public reply: MiNote | null;

	@Index()
	@Column({
		...id(),
		nullable: true,
		comment: 'The ID of renote target.',
	})
	public renoteId: MiNote['id'] | null;

	@ManyToOne(type => MiNote, {
		createForeignKeyConstraints: false,
	})
	@JoinColumn()
	public renote: MiNote | null;

	@Column({
		...id(),
		comment: 'The ID of author.',
	})
	public userId: MiUser['id'];

	@ManyToOne(type => MiUser, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public user: MiUser | null;

	@Column('boolean', {
		default: false,
	})
	public localOnly: boolean;

	@Index({ unique: true })
	@Column('varchar', {
		length: 512, nullable: true,
		comment: 'The URI of a note. it will be null when the note is local.',
	})
	public uri: string | null;

	@Column('varchar', {
		length: 512, nullable: true,
		comment: 'The human readable url of a note. it will be null when the note is local.',
	})
	public url: string | null;

	@Index() // for cascading
	@Column({
		...id(),
		nullable: true,
		comment: 'The ID of source channel.',
	})
	public channelId: MiChannel['id'] | null;

	@Column({
		...id(),
		nullable: true,
		comment: '[Denormalized]',
	})
	public replyUserId: MiUser['id'] | null;

	@Column({
		...id(),
		nullable: true,
		comment: '[Denormalized]',
	})
	public renoteUserId: MiUser['id'] | null;

	@ManyToOne(type => MiChannel, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public channel: MiChannel | null;

	constructor(data: Partial<MiDeletedNote>) {
		if (data == null) return;

		for (const [k, v] of Object.entries(data)) {
			(this as any)[k] = v;
		}
	}
}

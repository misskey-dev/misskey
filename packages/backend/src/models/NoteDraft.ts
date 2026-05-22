/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Entity, Index, JoinColumn, Column, PrimaryColumn, ManyToOne } from 'typeorm';
import { noteVisibilities, noteReactionAcceptances } from '@/types.js';
import { id } from './util/id.js';
import { MiUser } from './User.js';
import { MiChannel } from './Channel.js';
import { MiNote } from './Note.js';
import type { MiDriveFile } from './DriveFile.js';

@Entity('note_draft')
@Index('IDX_NOTE_DRAFT_FILE_IDS', { synchronize: false }) // GIN for fileIds in production
@Index('IDX_NOTE_DRAFT_VISIBLE_USER_IDS', { synchronize: false }) // GIN for visibleUserIds in production
export class MiNoteDraft {
	@PrimaryColumn(id())
	public id: string;

	@Index('IDX_NOTE_DRAFT_REPLY_ID')
	@Column({
		...id(),
		nullable: true,
		comment: 'The ID of reply target.',
	})
	public replyId: MiNote['id'] | null;

	// There is a possibility that replyId is not null but reply is null when the reply note is deleted.
	@ManyToOne(() => MiNote, {
		createForeignKeyConstraints: false,
	})
	@JoinColumn()
	public reply: MiNote | null;

	@Index('IDX_NOTE_DRAFT_RENOTE_ID')
	@Column({
		...id(),
		nullable: true,
		comment: 'The ID of renote target.',
	})
	public renoteId: MiNote['id'] | null;

	// There is a possibility that renoteId is not null but renote is null when the renote note is deleted.
	@ManyToOne(() => MiNote, {
		createForeignKeyConstraints: false,
	})
	@JoinColumn()
	public renote: MiNote | null;

	// TODO: varcharにしたい(Note.tsと同じ)
	@Column('text', {
		nullable: true,
	})
	public text: string | null;

	@Column('varchar', {
		length: 512, nullable: true,
	})
	public cw: string | null;

	@Index('IDX_NOTE_DRAFT_USER_ID')
	@Column({
		...id(),
		comment: 'The ID of author.',
	})
	public userId: MiUser['id'];

	@ManyToOne(() => MiUser, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public user: MiUser | null;

	@Column('boolean', {
		default: false,
	})
	public localOnly: boolean;

	@Column('varchar', {
		length: 64, nullable: true,
	})
	public reactionAcceptance: typeof noteReactionAcceptances[number];

	/**
	 * public ... 公開
	 * home ... ホームタイムライン(ユーザーページのタイムライン含む)のみに流す
	 * followers ... フォロワーのみ
	 * specified ... visibleUserIds で指定したユーザーのみ
	 */
	@Column('enum', { enum: noteVisibilities })
	public visibility: typeof noteVisibilities[number];

	@Index('IDX_NOTE_DRAFT_FILE_IDS', { synchronize: false })
	@Column({
		...id(),
		array: true, default: '{}',
	})
	public fileIds: MiDriveFile['id'][];

	@Index('IDX_NOTE_DRAFT_VISIBLE_USER_IDS', { synchronize: false })
	@Column({
		...id(),
		array: true, default: '{}',
	})
	public visibleUserIds: MiUser['id'][];

	@Column('varchar', {
		length: 128, nullable: true,
	})
	public hashtag: string | null;

	@Index('IDX_NOTE_DRAFT_CHANNEL_ID')
	@Column({
		...id(),
		nullable: true,
		comment: 'The ID of source channel.',
	})
	public channelId: MiChannel['id'] | null;

	// There is a possibility that channelId is not null but channel is null when the channel is deleted.
	// (deleting channel is not implemented so it's not happening now but may happen in the future)
	@ManyToOne(() => MiChannel, {
		createForeignKeyConstraints: false,
	})
	@JoinColumn()
	public channel: MiChannel | null;

	//#region 以下、Pollについて追加

	@Column('boolean', {
		default: false,
	})
	public hasPoll: boolean;

	@Column('varchar', {
		length: 256, array: true, default: '{}',
	})
	public pollChoices: string[];

	@Column('boolean')
	public pollMultiple: boolean;

	@Column('timestamp with time zone', {
		nullable: true,
	})
	public pollExpiresAt: Date | null;

	@Column('bigint', {
		nullable: true,
	})
	public pollExpiredAfter: number | null;

	//#endregion

	// 予約日時
	// これがあるだけでは実際に予約されているかどうかはわからない
	@Column('timestamp with time zone', {
		nullable: true,
	})
	public scheduledAt: Date | null;

	// scheduledAtに基づいて実際にスケジュールされているか
	@Column('boolean', {
		default: false,
	})
	public isActuallyScheduled: boolean;
}

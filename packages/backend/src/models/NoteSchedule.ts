/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Entity, Index, Column, PrimaryColumn } from 'typeorm';
import { MiNote } from '@/models/Note.js';
import { id } from './util/id.js';
import { MiUser } from './User.js';
import { MiChannel } from './Channel.js';
import type { MiDriveFile } from './DriveFile.js';

type MinimumUser = {
	id: MiUser['id'];
	host: MiUser['host'];
	username: MiUser['username'];
	uri: MiUser['uri'];
};

export type MiScheduleNoteType={
	visibility: 'public' | 'home' | 'followers' | 'specified';
	visibleUsers: MinimumUser[];
	channel?: MiChannel['id'];
	poll: {
		multiple: boolean;
		choices: string[];
		/** Date.toISOString() */
		expiresAt: string | null
	} | undefined;
	renote?: MiNote['id'];
	localOnly: boolean;
	cw?: string | null;
	reactionAcceptance: 'likeOnly' | 'likeOnlyForRemote' | 'nonSensitiveOnly' | 'nonSensitiveOnlyForLocalLikeOnlyForRemote' | null;
	files: MiDriveFile['id'][];
	text?: string | null;
	reply?: MiNote['id'];
	apMentions?: MinimumUser[] | null;
	apHashtags?: string[] | null;
	apEmojis?: string[] | null;
}

@Entity('note_schedule')
export class MiNoteSchedule {
	@PrimaryColumn(id())
	public id: string;

	@Column('jsonb')
	public note: MiScheduleNoteType;

	@Index()
	@Column('varchar', {
		length: 260,
	})
	public userId: MiUser['id'];

	@Column('timestamp with time zone')
	public scheduledAt: Date;
}

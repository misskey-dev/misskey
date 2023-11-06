/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Entity, Index, JoinColumn, Column, PrimaryColumn, ManyToOne } from 'typeorm';
import { noteVisibilities } from '@/types.js';
import { MiNote } from '@/models/Note.js';
import { id } from './util/id.js';
import { MiUser } from './User.js';
import { MiChannel } from './Channel.js';
import type { MiDriveFile } from './DriveFile.js';

@Entity('note_schedule')
export class MiNoteSchedule {
	@PrimaryColumn(id())
	public noteId: MiNote['id'];

	@Column('string')
	public note:{ apEmojis: any[] | undefined; visibility: any; apMentions: any[] | undefined; visibleUsers: MiUser[]; channel: null | MiChannel; poll: { multiple: any; choices: any; expiresAt: Date | null } | undefined; renote: null | MiNote; localOnly: any; cw: any; apHashtags: any[] | undefined; reactionAcceptance: any; files: MiDriveFile[]; text: any; reply: null | MiNote };

	@Column('string')
	public user: MiUser & {host: null;uri: null;};

	@Column('timestamp with time zone', {
		nullable: true,
	})
	public expiresAt: Date;
}

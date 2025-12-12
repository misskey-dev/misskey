/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { MiAnnouncement } from './Announcement.js';
import { MiUser } from './User.js';
import { id } from './util/id.js';

@Entity('announcement_read')
@Index(['userId', 'announcementId'], { unique: true })
export class MiAnnouncementRead {
	@PrimaryColumn(id())
	public id: string;

	@Index()
	@Column(id())
	public userId: MiUser['id'];

	@ManyToOne(() => MiUser, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public user: MiUser | null;

	@Index()
	@Column(id())
	public announcementId: MiAnnouncement['id'];

	@ManyToOne(() => MiAnnouncement, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public announcement: MiAnnouncement | null;
}

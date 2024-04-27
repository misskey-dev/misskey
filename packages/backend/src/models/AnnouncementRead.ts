/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { PrimaryColumn, Entity, Index, JoinColumn, Column, ManyToOne } from 'typeorm';
import { id } from './util/id.js';
import { MiUser } from './User.js';
import { MiAnnouncement } from './Announcement.js';

@Entity('announcement_read')
@Index(['userId', 'announcementId'], { unique: true })
export class MiAnnouncementRead {
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
	public announcementId: MiAnnouncement['id'];

	@ManyToOne(type => MiAnnouncement, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public announcement: MiAnnouncement | null;
}

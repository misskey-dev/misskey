/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { PrimaryColumn, Entity, Index, JoinColumn, Column, ManyToOne } from 'typeorm';
import { id } from './util/id.js';
import { MiAnnouncement } from './Announcement.js';
import { MiRole } from './Role.js';

@Entity('announcement_role')
@Index(['announcementId', 'roleId'], { unique: true })
export class MiAnnouncementRole {
	@PrimaryColumn(id())
	public id: string;

	@Index()
	@Column(id())
	public announcementId: MiAnnouncement['id'];

	@ManyToOne(type => MiAnnouncement, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public announcement: MiAnnouncement | null;

	@Index()
	@Column(id())
	public roleId: MiRole['id'];

	@ManyToOne(type => MiRole, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public role: MiRole | null;
}

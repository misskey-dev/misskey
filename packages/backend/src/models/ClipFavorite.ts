/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { PrimaryColumn, Entity, Index, JoinColumn, Column, ManyToOne } from 'typeorm';
import { id } from './util/id.js';
import { MiUser } from './User.js';
import { MiClip } from './Clip.js';

@Entity('clip_favorite')
@Index(['userId', 'clipId'], { unique: true })
export class MiClipFavorite {
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

	@Column(id())
	public clipId: MiClip['id'];

	@ManyToOne(type => MiClip, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public clip: MiClip | null;
}

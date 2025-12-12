/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { MiClip } from './Clip.js';
import { MiUser } from './User.js';
import { id } from './util/id.js';

@Entity('clip_favorite')
@Index(['userId', 'clipId'], { unique: true })
export class MiClipFavorite {
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

	@Column(id())
	public clipId: MiClip['id'];

	@ManyToOne(() => MiClip, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public clip: MiClip | null;
}

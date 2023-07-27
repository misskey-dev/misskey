/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { PrimaryColumn, Entity, Index, JoinColumn, Column, ManyToOne } from 'typeorm';
import { id } from '../id.js';
import { User } from './User.js';
import { GalleryPost } from './GalleryPost.js';

@Entity()
@Index(['userId', 'postId'], { unique: true })
export class GalleryLike {
	@PrimaryColumn(id())
	public id: string;

	@Column('timestamp with time zone')
	public createdAt: Date;

	@Index()
	@Column(id())
	public userId: User['id'];

	@ManyToOne(type => User, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public user: User | null;

	@Column(id())
	public postId: GalleryPost['id'];

	@ManyToOne(type => GalleryPost, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public post: GalleryPost | null;
}

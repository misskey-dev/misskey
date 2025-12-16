/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { MiPage } from './Page.js';
import { MiUser } from './User.js';
import { id } from './util/id.js';

@Entity('page_like')
@Index(['userId', 'pageId'], { unique: true })
export class MiPageLike {
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
	public pageId: MiPage['id'];

	@ManyToOne(() => MiPage, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public page: MiPage | null;
}

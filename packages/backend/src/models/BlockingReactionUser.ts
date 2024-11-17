/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { PrimaryColumn, Entity, Index, JoinColumn, Column, ManyToOne } from 'typeorm';
import { id } from './util/id.js';
import { MiUser } from './User.js';

@Entity('blocking_reaction_user')
@Index(['blockerId', 'blockeeId'], { unique: true })
export class MiBlockingReactionUser {
	@PrimaryColumn(id())
	public id: string;

	@Index()
	@Column({
		...id(),
		comment: 'The blockee user ID.',
	})
	public blockeeId: MiUser['id'];

	@ManyToOne(type => MiUser, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public blockee: MiUser | null;

	@Index()
	@Column({
		...id(),
		comment: 'The blocker user ID.',
	})
	public blockerId: MiUser['id'];

	@ManyToOne(type => MiUser, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public blocker: MiUser | null;
}

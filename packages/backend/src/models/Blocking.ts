/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { PrimaryColumn, Entity, Index, JoinColumn, Column, ManyToOne } from 'typeorm';
import { id } from './util/id.js';
import { MiUser } from './User.js';

export enum MiBlockingType {
	User = 'user',
	Reaction = 'reaction',
}

@Entity('blocking')
@Index(['blockerId', 'blockeeId'], { unique: true })
export class MiBlocking {
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

	@Index()
	@Column({
		comment: 'Block type.',
		default: MiBlockingType.User,
	})
	public blockType: MiBlockingType;
}

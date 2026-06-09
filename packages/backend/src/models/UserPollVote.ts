/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Entity, Index, Column, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';
import { id } from './util/id.js';
import { MiUser } from './User.js';
import { MiUserPoll } from './UserPoll.js';

@Entity('user_poll_vote')
@Index(['pollId', 'userId'], { unique: true })
export class MiUserPollVote {
	@PrimaryColumn(id())
	public id: string;

	@Index()
	@Column(id())
	public pollId: MiUserPoll['id'];

	@ManyToOne(() => MiUserPoll, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public poll: MiUserPoll | null;

	@Index()
	@Column(id())
	public userId: MiUser['id'];

	@ManyToOne(() => MiUser, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public user: MiUser | null;

	@Column('integer', {
		nullable: false,
	})
	public choiceIndex: number;

	constructor(data: Partial<MiUserPollVote>) {
		if (data == null) return;
		for (const [k, v] of Object.entries(data)) {
			(this as any)[k] = v;
		}
	}
}

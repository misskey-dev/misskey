/*
 * SPDX-FileCopyrightText: Rickskey Project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Entity, Index, Column, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';
import { id } from './util/id.js';
import { MiUser } from './User.js';
import { MiEmojiProposal } from './EmojiProposal.js';

@Entity('emoji_proposal_vote')
@Index(['proposalId', 'userId'], { unique: true })
export class MiEmojiProposalVote {
	@PrimaryColumn(id())
	public id: string;

	@Index()
	@Column(id())
	public proposalId: MiEmojiProposal['id'];

	@ManyToOne(() => MiEmojiProposal, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public proposal: MiEmojiProposal | null;

	@Index()
	@Column(id())
	public userId: MiUser['id'];

	@ManyToOne(() => MiUser, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public user: MiUser | null;

	constructor(data: Partial<MiEmojiProposalVote>) {
		if (data == null) return;
		for (const [k, v] of Object.entries(data)) {
			(this as any)[k] = v;
		}
	}
}

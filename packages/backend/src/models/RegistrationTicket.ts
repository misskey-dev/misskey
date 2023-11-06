/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { PrimaryColumn, Entity, Index, Column, ManyToOne, JoinColumn, OneToOne } from 'typeorm';
import { id } from './util/id.js';
import { MiUser } from './User.js';

@Entity('registration_ticket')
export class MiRegistrationTicket {
	@PrimaryColumn(id())
	public id: string;

	@Index({ unique: true })
	@Column('varchar', {
		length: 64,
	})
	public code: string;

	@Column('timestamp with time zone', {
		nullable: true,
	})
	public expiresAt: Date | null;

	@ManyToOne(type => MiUser, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public createdBy: MiUser | null;

	@Index()
	@Column({
		...id(),
		nullable: true,
	})
	public createdById: MiUser['id'] | null;

	@OneToOne(type => MiUser, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public usedBy: MiUser | null;

	@Index()
	@Column({
		...id(),
		nullable: true,
	})
	public usedById: MiUser['id'] | null;

	@Column('timestamp with time zone', {
		nullable: true,
	})
	public usedAt: Date | null;

	@Column('varchar', {
		length: 32,
		nullable: true,
	})
	public pendingUserId: string | null;
}

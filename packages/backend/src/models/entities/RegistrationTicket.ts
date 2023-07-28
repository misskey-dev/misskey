/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { PrimaryColumn, Entity, Index, Column, ManyToOne, JoinColumn, OneToOne } from 'typeorm';
import { id } from '../id.js';
import { User } from './User.js';

@Entity()
export class RegistrationTicket {
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

	@Column('timestamp with time zone')
	public createdAt: Date;

	@ManyToOne(type => User, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public createdBy: User | null;

	@Index()
	@Column({
		...id(),
		nullable: true,
	})
	public createdById: User['id'] | null;

	@OneToOne(type => User, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public usedBy: User | null;

	@Index()
	@Column({
		...id(),
		nullable: true,
	})
	public usedById: User['id'] | null;

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

/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { PrimaryColumn, Entity, Index, JoinColumn, Column, ManyToOne } from 'typeorm';
import { id } from './util/id.js';
import { MiUser } from './User.js';

@Entity('following')
@Index(['followerId', 'followeeId'], { unique: true })
export class MiFollowing {
	@PrimaryColumn(id())
	public id: string;

	@Index()
	@Column('timestamp with time zone', {
		comment: 'The created date of the Following.',
	})
	public createdAt: Date;

	@Index()
	@Column({
		...id(),
		comment: 'The followee user ID.',
	})
	public followeeId: MiUser['id'];

	@ManyToOne(type => MiUser, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public followee: MiUser | null;

	@Index()
	@Column({
		...id(),
		comment: 'The follower user ID.',
	})
	public followerId: MiUser['id'];

	@ManyToOne(type => MiUser, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public follower: MiUser | null;

	@Index()
	@Column('varchar', {
		length: 32,
		nullable: true,
	})
	public notify: 'normal' | null;

	//#region Denormalized fields
	@Index()
	@Column('varchar', {
		length: 128, nullable: true,
		comment: '[Denormalized]',
	})
	public followerHost: string | null;

	@Column('varchar', {
		length: 512, nullable: true,
		comment: '[Denormalized]',
	})
	public followerInbox: string | null;

	@Column('varchar', {
		length: 512, nullable: true,
		comment: '[Denormalized]',
	})
	public followerSharedInbox: string | null;

	@Index()
	@Column('varchar', {
		length: 128, nullable: true,
		comment: '[Denormalized]',
	})
	public followeeHost: string | null;

	@Column('varchar', {
		length: 512, nullable: true,
		comment: '[Denormalized]',
	})
	public followeeInbox: string | null;

	@Column('varchar', {
		length: 512, nullable: true,
		comment: '[Denormalized]',
	})
	public followeeSharedInbox: string | null;
	//#endregion
}

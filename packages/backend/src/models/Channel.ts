/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { PrimaryColumn, Entity, Index, JoinColumn, Column, ManyToOne } from 'typeorm';
import { id } from './util/id.js';
import { MiUser } from './User.js';
import { MiDriveFile } from './DriveFile.js';

@Entity('channel')
export class MiChannel {
	@PrimaryColumn(id())
	public id: string;

	@Index()
	@Column('timestamp with time zone', {
		nullable: true,
	})
	public lastNotedAt: Date | null;

	@Index()
	@Column({
		...id(),
		nullable: true,
		comment: 'The owner ID.',
	})
	public userId: MiUser['id'] | null;

	@ManyToOne(type => MiUser, {
		onDelete: 'SET NULL',
	})
	@JoinColumn()
	public user: MiUser | null;

	@Column('varchar', {
		length: 128,
		comment: 'The name of the Channel.',
	})
	public name: string;

	@Column('varchar', {
		length: 2048, nullable: true,
		comment: 'The description of the Channel.',
	})
	public description: string | null;

	@Column({
		...id(),
		nullable: true,
		comment: 'The ID of banner Channel.',
	})
	public bannerId: MiDriveFile['id'] | null;

	@ManyToOne(type => MiDriveFile, {
		onDelete: 'SET NULL',
	})
	@JoinColumn()
	public banner: MiDriveFile | null;

	@Column('varchar', {
		array: true, length: 128, default: '{}',
	})
	public pinnedNoteIds: string[];

	@Column('varchar', {
		length: 16,
		default: '#86b300',
	})
	public color: string;

	@Index()
	@Column('boolean', {
		default: false,
	})
	public isArchived: boolean;

	@Index()
	@Column('integer', {
		default: 0,
		comment: 'The count of notes.',
	})
	public notesCount: number;

	@Index()
	@Column('integer', {
		default: 0,
		comment: 'The count of users.',
	})
	public usersCount: number;

	@Column('boolean', {
		default: false,
	})
	public isSensitive: boolean;

	@Column('boolean', {
		default: true,
	})
	public allowRenoteToExternal: boolean;
}

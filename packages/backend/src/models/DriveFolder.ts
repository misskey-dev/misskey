/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { JoinColumn, ManyToOne, Entity, PrimaryColumn, Index, Column } from 'typeorm';
import { id } from './util/id.js';
import { MiUser } from './User.js';

@Entity('drive_folder')
export class MiDriveFolder {
	@PrimaryColumn(id())
	public id: string;

	@Column('varchar', {
		length: 128,
		comment: 'The name of the DriveFolder.',
	})
	public name: string;

	@Index()
	@Column({
		...id(),
		nullable: true,
		comment: 'The owner ID.',
	})
	public userId: MiUser['id'] | null;

	@ManyToOne(type => MiUser, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public user: MiUser | null;

	@Index()
	@Column({
		...id(),
		nullable: true,
		comment: 'The parent folder ID. If null, it means the DriveFolder is located in root.',
	})
	public parentId: MiDriveFolder['id'] | null;

	@ManyToOne(type => MiDriveFolder, {
		onDelete: 'SET NULL',
	})
	@JoinColumn()
	public parent: MiDriveFolder | null;
}

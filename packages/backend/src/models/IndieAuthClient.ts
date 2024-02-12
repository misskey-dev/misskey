/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { PrimaryColumn, Entity, Column, Index } from 'typeorm';

@Entity('indie_auth_client')
export class MiIndieAuthClient {
	@PrimaryColumn('varchar', {
		length: 512,
	})
	public id: string;

	@Index()
	@Column('timestamp with time zone', {
		default: () => 'CURRENT_TIMESTAMP',
	})
	public createdAt: Date;

	@Column('varchar', {
		length: 256, nullable: true,
	})
	public name: string | null;

	@Column('varchar', {
		array: true, length: 512, default: '{}',
	})
	public redirectUris: string[];
}

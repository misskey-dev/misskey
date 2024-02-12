/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { PrimaryColumn, Entity, Column, Index } from 'typeorm';

@Entity('used_username')
export class MiUsedUsername {
	@PrimaryColumn('varchar', {
		length: 128,
	})
	public username: string;

	@Index()
	@Column('timestamp with time zone', {
		comment: 'The created date of the UsedUsername.',
		default: () => 'CURRENT_TIMESTAMP',
	})
	public createdAt: Date;

	constructor(data: Partial<MiUsedUsername>) {
		if (data == null) return;

		for (const [k, v] of Object.entries(data)) {
			(this as any)[k] = v;
		}
	}
}

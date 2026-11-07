/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { PrimaryColumn, Entity, Column } from 'typeorm';

@Entity('used_username')
export class MiUsedUsername {
	@PrimaryColumn('varchar', {
		length: 128,
	})
	public username: string;

	@Column('timestamp with time zone')
	public createdAt: Date;

	constructor(data: Partial<MiUsedUsername>) {
		if (data == null) return;

		for (const [k, v] of Object.entries(data)) {
			(this as any)[k] = v;
		}
	}
}

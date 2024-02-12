/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Column, Entity, PrimaryColumn, Index } from 'typeorm';
import { id } from './util/id.js';

@Entity('abuse_report_resolver')
export class MiAbuseReportResolver {
	@PrimaryColumn(id())
	public id: string;

	@Index()
	@Column('timestamp with time zone', {
		comment: 'The created date of the AbuseReportResolver.',
		default: () => 'CURRENT_TIMESTAMP',
	})
	public createdAt: Date;

	@Index()
	@Column('timestamp with time zone', {
		comment: 'The updated date of AbuseReportResolver',
	})
	public updatedAt: Date;

	@Column('varchar', {
		length: 256,
	})
	public name: string;

	@Column('varchar', {
		length: 1024,
		nullable: true,
	})
	public targetUserPattern: string | null;

	@Column('varchar', {
		length: 1024,
		nullable: true,
	})
	public reporterPattern: string | null;

	@Column('varchar', {
		length: 1024,
		nullable: true,
	})
	public reportContentPattern: string | null;

	@Index()
	@Column('timestamp with time zone', {
		comment: 'The expiration date of AbuseReportResolver',
		nullable: true,
	})
	public expirationDate: Date | null;

	@Column('enum', {
		enum: ['1hour', '12hours', '1day', '1week', '1month', '3months', '6months', '1year', 'indefinitely']
	})
	public expiresAt: string;

	@Column('boolean')
	public forward: boolean;
}

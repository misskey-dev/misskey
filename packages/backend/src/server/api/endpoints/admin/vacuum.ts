import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { insertModerationLog } from '@/services/insert-moderation-log.js';
import { db } from '@/db/postgre.js';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		full: { type: 'boolean' },
		analyze: { type: 'boolean' },
	},
	required: ['full', 'analyze'],
} as const;

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		@Inject('notesRepository')
    private notesRepository: typeof Notes,
	) {
		super(meta, paramDef, async (ps, me) => {
	const params: string[] = [];

	if (ps.full) {
		params.push('FULL');
	}

	if (ps.analyze) {
		params.push('ANALYZE');
	}

	db.query('VACUUM ' + params.join(' '));

	insertModerationLog(me, 'vacuum', ps);
});

import { resetDb } from '@/db/postgre.js';
import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { ApiError } from '../error.js';

export const meta = {
	tags: ['non-productive'],

	requireCredential: false,

	description: 'Only available when running with <code>NODE_ENV=testing</code>. Reset the database and flush Redis.',

	errors: {

	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {},
	required: [],
} as const;

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		@Inject('notesRepository')
    private notesRepository: typeof Notes,
	) {
		super(meta, paramDef, async (ps, user) => {
	if (process.env.NODE_ENV !== 'test') throw 'NODE_ENV is not a test';

	await resetDb();

	await new Promise(resolve => setTimeout(resolve, 1000));
});

import { Inject, Injectable } from '@nestjs/common';
import { Brackets } from 'typeorm';
import { Event } from '@/models/entities/Event.js';
import type { NotesRepository } from '@/models/index.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { QueryService } from '@/core/QueryService.js';
import { NoteEntityService } from '@/core/entities/NoteEntityService.js';
import type { Config } from '@/config.js';
import { DI } from '@/di-symbols.js';
import { RoleService } from '@/core/RoleService.js';
import { sqlLikeEscape } from '@/misc/sql-like-escape.js';
import { ApiError } from '../../../error.js';

export const meta = {
	tags: ['notes'],

	requireCredential: false,

	res: {
		type: 'array',
		optional: false, nullable: false,
		items: {
			type: 'object',
			optional: false, nullable: false,
			ref: 'Note',
		},
	},

	errors: {
		unavailable: {
			message: 'Search of notes unavailable.',
			code: 'UNAVAILABLE',
			id: '0b44998d-77aa-4427-80d0-d2c9b8523011',
		},
		invalidParam: {
			message: 'Invalid Parameter',
			code: 'INVALID_PARAM',
			id: 'e70903d3-0aa2-44d5-a955-4de5723c603d',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		query: { type: 'string', nullable: true },
		sinceId: { type: 'string', format: 'misskey:id' },
		untilId: { type: 'string', format: 'misskey:id' },
		limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
		offset: { type: 'integer', default: 0 },
		users: { type: 'array', nullable: true, items: { type: 'string', format: 'misskey:id' } },
		sinceDate: { type: 'integer', nullable: true },
		untilDate: { type: 'integer', nullable: true },
		filters: {
			type: 'array',
			nullable: true,
			description: 'list of string -> [string] that filters events based on metadata. Each item in filters is applied as an AND',
			items: {
				type: 'object',
				properties: {
					key: { type: 'array', items: { type: 'string', nullable: false }, description: 'the metadata string property to filter on. Can filter on nested properties using an array. such as `["location", "postalCode"]`.' },
					values: { type: 'array', items: { type: 'string', nullable: true }, description: 'The values to match the metadata against (case insensitive regex). Each item in this array is applied as an OR. Include null to indicate match on missing metadata' },
				},
			},
		},
		sortBy: { type: 'string', nullable: true, default: 'startDate', enum: ['startDate', 'createdAt'] },
	},
} as const;

function notAlphaNumeric(s: string): boolean {
	return null !== s.match(/[^\w]/);
}

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		@Inject(DI.config)
		private config: Config,
	
		@Inject(DI.notesRepository)
		private notesRepository: NotesRepository,

		private noteEntityService: NoteEntityService,
		private queryService: QueryService,
		private roleService: RoleService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const policies = await this.roleService.getUserPolicies(me ? me.id : null);
			if (!policies.canSearchNotes) {
				throw new ApiError(meta.errors.unavailable);
			}
	
			const queryRunner = this.notesRepository.queryRunner;
			const query = this.queryService.makePaginationQuery(this.notesRepository.createQueryBuilder('note', queryRunner), ps.sinceId, ps.untilId);

			if (ps.users) {
				if (ps.users.length < 1) throw new ApiError(meta.errors.invalidParam);
				query.andWhere('note.userId IN (:...users)', { users: ps.users });
			}

			query
				.innerJoinAndSelect(Event, 'event', 'event.noteId = note.id')
				.innerJoinAndSelect('note.user', 'user');

			if (ps.query && ps.query.trim() !== '') {
				query.andWhere(new Brackets((qb) => {
					const q = (ps.query ?? '').trim();
					qb.where('event.title ILIKE :q', { q: `%${ sqlLikeEscape(q) }%` })
						.orWhere('note.text ILIKE :q', { q: `%${ sqlLikeEscape(q) }%` });
				}));
			}
			if (ps.filters) {
				const filters = ps.filters;
				
				filters.forEach(f => {
					if (!f.key || !f.values) throw new ApiError(meta.errors.invalidParam);
					const filterKey = f.key;
					if (filterKey.some(notAlphaNumeric)) throw new ApiError(meta.errors.invalidParam); // schema properties don't have special characters
					const filterValues = f.values as (string | null)[];
					const matches = filterValues.filter(x => x !== null) as string[];
					const hasNull = filterValues.length !== matches.length;
					if (matches.length < 1) throw new ApiError(meta.errors.invalidParam);
					query.andWhere(new Brackets((qb) => {
						// regex match metadata values case insensitive
						qb.where('event.metadata #>> :key ~* :values', { key: `{${filterKey.join(',')}}`, values: `(${ matches.map(m => m.trim()).filter(m => m.length).join('|') })` });
						if (hasNull) {
							qb.orWhere('NOT (event.metadata ? :key)', { key: filterKey });
						}
					}));
				});
			}

			if (ps.sinceDate && ps.untilDate && ps.sinceDate > ps.untilDate) throw new ApiError(meta.errors.invalidParam);

			if (ps.sinceDate || ps.sortBy !== 'createdAt') {
				const sinceDate = ps.sinceDate ? new Date(ps.sinceDate) : new Date();
				query.andWhere('event.start > :sinceDate', { sinceDate: sinceDate })
					.andWhere('(event.end IS NULL OR event.end > :sinceDate)', { sinceDate: sinceDate });
			}

			if (ps.untilDate) {
				query.andWhere('event.start < :untilDate', { untilDate: new Date(ps.untilDate) });
			}

			if (ps.sortBy === 'createdAt') {
				query.orderBy('note.createdAt', 'DESC');
			} else {
				query.orderBy('event.start', 'ASC');
			}

			this.queryService.generateVisibilityQuery(query, me);
			if (me) this.queryService.generateMutedUserQuery(query, me);
			if (me) this.queryService.generateBlockedUserQuery(query, me);

			if (ps.offset) query.skip(ps.offset);

			query.maxExecutionTime(250); // because we include regex expressions in where clause, defend against long running regex with timeout
			const notes = await query.take(ps.limit).getMany();

			return await this.noteEntityService.packMany(notes, me);
		});
	}
}

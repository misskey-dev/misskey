import $ from 'cafy';
import define from '../../define';
import { Logs } from '@/models/index';
import { Brackets } from 'typeorm';

export const meta = {
	tags: ['admin'],

	requireCredential: true as const,
	requireModerator: true,

	params: {
		limit: {
			validator: $.optional.num.range(1, 100),
			default: 30
		},

		level: {
			validator: $.optional.nullable.str,
			default: null
		},

		domain: {
			validator: $.optional.nullable.str,
			default: null
		}
	},

	res: {
		type: 'array' as const,
		optional: false as const, nullable: false as const,
		items: {
			type: 'object' as const,
			optional: false as const, nullable: false as const,
			properties: {
				id: {
					type: 'string' as const,
					optional: false as const, nullable: false as const,
					format: 'id',
					example: 'xxxxxxxxxx',
				},
				createdAt: {
					type: 'string' as const,
					optional: false as const, nullable: false as const,
					format: 'date-time',
				},
				domain: {
					type: 'array' as const,
					optional: false as const, nullable: false as const,
					items: {
						type: 'string' as const,
						optional: true as const, nullable: false as const
					}
				},
				level: {
					type: 'string' as const,
					optional: false as const, nullable: false as const
				},
				worker: {
					type: 'string' as const,
					optional: false as const, nullable: false as const
				},
				machine: {
					type: 'string' as const,
					optional: false as const, nullable: false as const,
				},
				message: {
					type: 'string' as const,
					optional: false as const, nullable: false as const,
				},
				data: {
					type: 'object' as const,
					optional: false as const, nullable: false as const
				}
			}
		}
	}
};

export default define(meta, async (ps) => {
	const query = Logs.createQueryBuilder('log');

	if (ps.level) query.andWhere('log.level = :level', { level: ps.level });

	if (ps.domain) {
		const whiteDomains = ps.domain.split(' ').filter(x => !x.startsWith('-'));
		const blackDomains = ps.domain.split(' ').filter(x => x.startsWith('-')).map(x => x.substr(1));

		if (whiteDomains.length > 0) {
			query.andWhere(new Brackets(qb => {
				for (const whiteDomain of whiteDomains) {
					let i = 0;
					for (const subDomain of whiteDomain.split('.')) {
						const p = `whiteSubDomain_${subDomain}_${i}`;
						// SQL is 1 based, so we need '+ 1'
						qb.orWhere(`log.domain[${i + 1}] = :${p}`, { [p]: subDomain });
						i++;
					}
				}
			}));
		}

		if (blackDomains.length > 0) {
			query.andWhere(new Brackets(qb => {
				for (const blackDomain of blackDomains) {
					qb.andWhere(new Brackets(qb => {
						const subDomains = blackDomain.split('.');
						let i = 0;
						for (const subDomain of subDomains) {
							const p = `blackSubDomain_${subDomain}_${i}`;
							// 全体で否定できないのでド・モルガンの法則で
							// !(P && Q) を !P || !Q で表す
							// SQL is 1 based, so we need '+ 1'
							qb.orWhere(`log.domain[${i + 1}] != :${p}`, { [p]: subDomain });
							i++;
						}
					}));
				}
			}));
		}
	}

	const logs = await query.orderBy('log.createdAt', 'DESC').take(ps.limit!).getMany();

	return logs;
});

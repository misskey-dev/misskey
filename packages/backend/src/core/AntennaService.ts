/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import * as Redis from 'ioredis';
import RE2 from 're2';
import { IdService } from '@/core/IdService.js';
import { AntennaSource, MiAntenna } from '@/models/Antenna.js';
import type { MiNote } from '@/models/Note.js';
import type { MiUser } from '@/models/User.js';
import { GlobalEventService } from '@/core/GlobalEventService.js';
import * as Acct from '@/misc/acct.js';
import type { Packed } from '@/misc/json-schema.js';
import { DI } from '@/di-symbols.js';
import type { AntennasRepository } from '@/models/_.js';
import { UtilityService } from '@/core/UtilityService.js';
import { bindThis } from '@/decorators.js';
import type { GlobalEvents } from '@/core/GlobalEventService.js';
import { FanoutTimelineService } from '@/core/FanoutTimelineService.js';
import { RoleService } from './RoleService.js';
import type { OnApplicationShutdown } from '@nestjs/common';

type AntennaFilter = {
	antennaId: string;
	src: MiAntenna;
	testKeywords(target: string): boolean;
};

function matchAntennaKeywords(target: string, keywords: string[][]): boolean {
	return keywords.some(and => and.every(keyword => target.includes(keyword)));
}

function matchAntennaKeywordsCaseInsensitive(target: string, keywords: string[][]): boolean {
	const _target = target.toLowerCase();
	return keywords.some(and => and.every(keyword => _target.includes(keyword)));
}

function matchAntennaKeywordsRegex(target: string, patterns: RE2[]): boolean {
	return patterns.every(re => re.test(target));
}

export const antennaFilters = {
	regex: {
		includeAndExclude: (target: string, keywords: RE2[], excludeKeywords: RE2[]): boolean => {
			return matchAntennaKeywordsRegex(target, keywords) && !matchAntennaKeywordsRegex(target, excludeKeywords);
		},
		includeOnly: (target: string, keywords: RE2[]): boolean => {
			return matchAntennaKeywordsRegex(target, keywords);
		},
		excludeOnly: (target: string, excludeKeywords: RE2[]): boolean => {
			return !matchAntennaKeywordsRegex(target, excludeKeywords);
		},
	},
	noRegex: {
		caseSensitive: {
			includeAndExclude: (target: string, keywords: string[][], excludeKeywords: string[][]): boolean => {
				return matchAntennaKeywords(target, keywords) && !matchAntennaKeywords(target, excludeKeywords);
			},
			includeOnly: (target: string, keywords: string[][]): boolean => {
				return matchAntennaKeywords(target, keywords);
			},
			excludeOnly: (target: string, excludeKeywords: string[][]): boolean => {
				return !matchAntennaKeywords(target, excludeKeywords);
			},
		},
		caseInsensitive: {
			includeAndExclude: (target: string, keywords: string[][], excludeKeywords: string[][]): boolean => {
				return matchAntennaKeywordsCaseInsensitive(target, keywords) && !matchAntennaKeywordsCaseInsensitive(target, excludeKeywords);
			},
			includeOnly: (target: string, keywords: string[][]): boolean => {
				return matchAntennaKeywordsCaseInsensitive(target, keywords);
			},
			excludeOnly: (target: string, excludeKeywords: string[][]): boolean => {
				return !matchAntennaKeywordsCaseInsensitive(target, excludeKeywords);
			},
		},
	},
};

function alwaysTrue(): boolean {
	return true;
}

export function createAntennaFilter(antenna: MiAntenna): AntennaFilter {
	function createTestKeywordsFunction(antenna: MiAntenna): AntennaFilter['testKeywords'] {
		// Clean up
		const keywords = antenna.keywords
			.map(xs => xs.filter(x => x !== ''))
			.filter(xs => xs.length > 0);
		const excludeKeywords = antenna.excludeKeywords
			.map(xs => xs.filter(x => x !== ''))
			.filter(xs => xs.length > 0);

		if (antenna.useRegex) {
			// 元々はAND検索を行うために2次元配列としてもっていた歴史的経緯がある.
			// 正規表現の時は1行に付き1パターンとするため、[n][0]にパターンの内容すべてが格納されているものとして扱う.
			const keywordsPatterns = keywords.map(line => new RE2(line[0]));
			const excludeKeywordsPatterns = excludeKeywords.map(line => new RE2(line[0]));

			if (keywords.length > 0 && excludeKeywords.length > 0) {
				return (target: string) => antennaFilters.regex.includeAndExclude(target, keywordsPatterns, excludeKeywordsPatterns);
			} else if (keywords.length > 0) {
				return (target: string) => antennaFilters.regex.includeOnly(target, keywordsPatterns);
			} else if (excludeKeywords.length > 0) {
				return (target: string) => antennaFilters.regex.excludeOnly(target, excludeKeywordsPatterns);
			} else {
				return alwaysTrue;
			}
		} else if (antenna.caseSensitive) {
			if (keywords.length > 0 && excludeKeywords.length > 0) {
				return (target: string) => antennaFilters.noRegex.caseSensitive.includeAndExclude(target, keywords, excludeKeywords);
			} else if (keywords.length > 0) {
				return (target: string) => antennaFilters.noRegex.caseSensitive.includeOnly(target, keywords);
			} else if (excludeKeywords.length > 0) {
				return (target: string) => antennaFilters.noRegex.caseSensitive.excludeOnly(target, excludeKeywords);
			} else {
				return alwaysTrue;
			}
		} else {
			if (keywords.length > 0 && excludeKeywords.length > 0) {
				return (target: string) => antennaFilters.noRegex.caseInsensitive.includeAndExclude(target, keywords, excludeKeywords);
			} else if (keywords.length > 0) {
				return (target: string) => antennaFilters.noRegex.caseInsensitive.includeOnly(target, keywords);
			} else if (excludeKeywords.length > 0) {
				return (target: string) => antennaFilters.noRegex.caseInsensitive.excludeOnly(target, excludeKeywords);
			} else {
				return alwaysTrue;
			}
		}
	}

	return {
		antennaId: antenna.id,
		src: antenna,
		testKeywords: createTestKeywordsFunction(antenna),
	};
}

@Injectable()
export class AntennaService implements OnApplicationShutdown {
	public static AntennaNotFoundError = class extends Error {
	};
	public static EmptyKeyWordError = class extends Error {
	};
	public static TooManyAntennasError = class extends Error {
	};
	public static InvalidRegexPatternError = class extends Error {
		constructor(err?: unknown) {
			const msg = err instanceof Error ? err.message : undefined;
			super(msg);
		}
	};

	private filtersFetched: boolean;
	private filters: AntennaFilter[];

	constructor(
		@Inject(DI.redisForTimelines)
		private redisForTimelines: Redis.Redis,

		@Inject(DI.redisForSub)
		private redisForSub: Redis.Redis,

		@Inject(DI.antennasRepository)
		private antennasRepository: AntennasRepository,

		private roleService: RoleService,
		private utilityService: UtilityService,
		private globalEventService: GlobalEventService,
		private fanoutTimelineService: FanoutTimelineService,
		private idService: IdService,
	) {
		this.filtersFetched = false;
		this.filters = [];

		this.redisForSub.on('message', this.onRedisMessage);
	}

	@bindThis
	private async onRedisMessage(_: string, data: string): Promise<void> {
		const obj = JSON.parse(data);

		if (obj.channel === 'internal') {
			const { type, body } = obj.message as GlobalEvents['internal']['payload'];
			switch (type) {
				case 'antennaCreated': {
					this.filters.push(createAntennaFilter(MiAntenna.deserialize(body)));
					break;
				}
				case 'antennaUpdated': {
					const idx = this.filters.findIndex(a => a.antennaId === body.id);
					if (idx >= 0) {
						this.filters[idx] = createAntennaFilter(MiAntenna.deserialize(body));
					} else {
						// サーバ起動時にactiveじゃなかった場合、リストに持っていないので追加する必要あり
						this.filters.push(createAntennaFilter(MiAntenna.deserialize(body)));
					}
					break;
				}
				case 'antennaDeleted': {
					this.filters = this.filters.filter(a => a.antennaId !== body.id);
					break;
				}
				default:
					break;
			}
		}
	}

	@bindThis
	public async addNoteToAntennas(note: MiNote, noteUser: { id: MiUser['id']; username: string; host: string | null; isBot: boolean; }): Promise<void> {
		const filters = await this.getFilters();
		const redisPipeline = this.redisForTimelines.pipeline();

		for (const filter of filters) {
			if (this.checkHitAntenna(filter, note, noteUser)) {
				this.fanoutTimelineService.push(`antennaTimeline:${filter.antennaId}`, note.id, 200, redisPipeline);
				this.globalEventService.publishAntennaStream(filter.antennaId, 'note', note);
			}
		}

		redisPipeline.exec();
	}

	@bindThis
	public async create(
		ps: {
			name: string;
			src: AntennaSource;
			keywords: string[][];
			excludeKeywords: string[][];
			users: string[];
			caseSensitive: boolean;
			localOnly?: boolean;
			excludeBots?: boolean;
			useRegex?: boolean;
			withReplies: boolean;
			withFile: boolean;
		},
		me: MiUser,
	): Promise<MiAntenna> {
		this.validateEmptyKeyWord(ps);
		this.validateRegexPattern(ps);

		const currentAntennasCount = await this.antennasRepository.countBy({ userId: me.id	});
		if (currentAntennasCount >= (await this.roleService.getUserPolicies(me.id)).antennaLimit) {
			throw new AntennaService.TooManyAntennasError;
		}

		const now = new Date();
		const antenna = await this.antennasRepository.insertOne({
			id: this.idService.gen(now.getTime()),
			lastUsedAt: now,
			userId: me.id,
			name: ps.name,
			src: ps.src,
			keywords: ps.keywords,
			excludeKeywords: ps.excludeKeywords,
			users: ps.users,
			caseSensitive: ps.caseSensitive,
			localOnly: ps.localOnly,
			excludeBots: ps.excludeBots,
			withReplies: ps.withReplies,
			withFile: ps.withFile,
		});

		this.globalEventService.publishInternalEvent('antennaCreated', antenna);

		return antenna;
	}

	@bindThis
	public async update(
		ps: {
			antennaId: string;
			name?: string;
			src?: AntennaSource;
			keywords?: string[][];
			excludeKeywords?: string[][];
			users?: string[];
			caseSensitive?: boolean;
			localOnly?: boolean;
			excludeBots?: boolean;
			useRegex?: boolean;
			withReplies?: boolean;
			withFile?: boolean;
		},
		me: MiUser,
	): Promise<MiAntenna> {
		this.validateEmptyKeyWord({
			keywords: ps.keywords ?? [],
			excludeKeywords: ps.excludeKeywords ?? [],
		});

		this.validateRegexPattern({
			keywords: ps.keywords ?? [],
			excludeKeywords: ps.excludeKeywords ?? [],
			useRegex: ps.useRegex,
		});

		const antenna = await this.antennasRepository.findOneBy({
			id: ps.antennaId,
			userId: me.id,
		});
		if (antenna == null) {
			throw new AntennaService.AntennaNotFoundError;
		}

		await this.antennasRepository.update(antenna.id, {
			name: ps.name,
			src: ps.src,
			keywords: ps.keywords,
			excludeKeywords: ps.excludeKeywords,
			users: ps.users,
			caseSensitive: ps.caseSensitive,
			localOnly: ps.localOnly,
			excludeBots: ps.excludeBots,
			withReplies: ps.withReplies,
			withFile: ps.withFile,
			isActive: true,
			lastUsedAt: new Date(),
		});

		this.globalEventService.publishInternalEvent('antennaUpdated', await this.antennasRepository.findOneByOrFail({ id: antenna.id }));

		return antenna;
	}

	@bindThis
	private validateEmptyKeyWord(
		ps: {
			keywords: string[][];
			excludeKeywords: string[][];
		},
	) {
		if (ps.keywords.flat().every(x => x === '') && ps.excludeKeywords.flat().every(x => x === '')) {
			throw new AntennaService.EmptyKeyWordError;
		}
	}

	@bindThis
	private validateRegexPattern(
		ps: {
			keywords: string[][];
			excludeKeywords: string[][];
			useRegex?: boolean;
		},
	) {
		if (!ps.useRegex) {
			return;
		}

		// NOTE: 正規表現パターンの場合は2次元配列の2次元目0番地にパターンが格納されていることを前提にする

		if (ps.keywords.length > 0 && ps.keywords.some(x => x.length !== 1)) {
			throw new AntennaService.InvalidRegexPatternError();
		}

		if (ps.excludeKeywords.length > 0 && ps.excludeKeywords.some(x => x.length !== 1)) {
			throw new AntennaService.InvalidRegexPatternError();
		}

		for (const keywords of [ps.keywords, ps.excludeKeywords]) {
			for (const keyword of keywords) {
				const regexp = keyword[0].match(/^\/(.+)\/(.*)$/);
				if (!regexp) {
					throw new AntennaService.InvalidRegexPatternError();
				}

				try {
					new RE2(regexp[1], regexp[2]);
				} catch (err) {
					throw new AntennaService.InvalidRegexPatternError(err);
				}
			}
		}
	}

	@bindThis
	private isIncludeUser(antenna: MiAntenna, noteUser: { username: string; host: string | null; }): boolean {
		const antennaUserAccounts = antenna.users.map(x => {
			const { username, host } = Acct.parse(x);
			return this.utilityService.getFullApAccount(username, host).toLowerCase();
		});

		const noteUserAccount = this.utilityService.getFullApAccount(noteUser.username, noteUser.host).toLowerCase();
		return antennaUserAccounts.includes(noteUserAccount);
	}

	@bindThis
	private checkHitAntenna(
		filter: AntennaFilter,
		note: (MiNote | Packed<'Note'>),
		noteUser: { id: MiUser['id']; username: string; host: string | null; isBot: boolean; },
	): boolean {
		if (note.visibility === 'specified') return false;
		if (note.visibility === 'followers') return false;

		const antenna = filter.src;
		if (antenna.excludeBots && noteUser.isBot) return false;
		if (antenna.localOnly && noteUser.host != null) return false;
		if (!antenna.withReplies && note.replyId != null) return false;
		if (antenna.withFile) {
			if (note.fileIds && note.fileIds.length === 0) return false;
		}

		if (antenna.src === 'users') {
			if (!this.isIncludeUser(antenna, noteUser)) return false;
		} else if (antenna.src === 'users_blacklist') {
			if (this.isIncludeUser(antenna, noteUser)) return false;
		}

		const _text = (note.text ?? '') + '\n' + (note.cw ?? '');
		return filter.testKeywords(_text);
	}

	@bindThis
	private async getFilters() {
		if (!this.filtersFetched) {
			const antennas = await this.antennasRepository.findBy({ isActive: true });
			this.filters = antennas.map(createAntennaFilter);
			this.filtersFetched = true;
		}

		return this.filters;
	}

	@bindThis
	public dispose(): void {
		this.redisForSub.off('message', this.onRedisMessage);
	}

	@bindThis
	public onApplicationShutdown(signal?: string | undefined): void {
		this.dispose();
	}
}

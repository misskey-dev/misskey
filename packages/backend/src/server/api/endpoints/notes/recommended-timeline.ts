/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { In } from 'typeorm';
import { Inject, Injectable } from '@nestjs/common';
import type Redis from 'ioredis';
import type { DriveFilesRepository, FollowingsRepository, MiMeta, NoteFavoritesRepository, NoteReactionsRepository, NotesRepository } from '@/models/_.js';
import type { MiLocalUser } from '@/models/User.js';
import { DI } from '@/di-symbols.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { ApiError } from '@/server/api/error.js';
import { QueryService } from '@/core/QueryService.js';
import { NoteEntityService } from '@/core/entities/NoteEntityService.js';
import { IdService } from '@/core/IdService.js';

type Settings = {
	candidatePoolLimit: number;
	candidateScanLimit: number;
	resultLimit: number;
	snapshotHours: number;
	seenDays: number;
	seenLimit: number;
	twoHopPercent: number;
	followingPercent: number;
	unknownPercent: number;
	qualityPercent: number;
	balancedPercent: number;
	freshPercent: number;
	maxNotesPerAuthor: number;
	publicBonus: number;
	localUserBonus: number;
	reactionBonus: number;
	boostBonus: number;
	sensitivePenalty: number;
	botPenalty: number;
	twoHopRenoteBonus: number;
	negativePenalty: number;
	minimumScore: number;
	fallbackMaxAgeDays: number;
	forcedLimit: number;
	forcedAccounts: string[];
	negativeWords: string[];
	boostWords: string[];
	negativeAccounts: string[];
};

const defaults: Settings = {
	candidatePoolLimit: 3000,
	candidateScanLimit: 300,
	// Keep the first request deliberately small. Older entries are appended only
	// when the reader reaches the end of the fixed snapshot.
	resultLimit: 40,
	snapshotHours: 24,
	seenDays: 7,
	seenLimit: 1000,
	twoHopPercent: 60,
	followingPercent: 20,
	unknownPercent: 20,
	qualityPercent: 50,
	balancedPercent: 30,
	freshPercent: 20,
	maxNotesPerAuthor: 2,
	publicBonus: 2,
	localUserBonus: 2,
	reactionBonus: 1,
	boostBonus: 4,
	sensitivePenalty: 6,
	botPenalty: 3,
	twoHopRenoteBonus: 6,
	negativePenalty: 8,
	minimumScore: 0,
	fallbackMaxAgeDays: 90,
	forcedLimit: 3,
	forcedAccounts: [],
	negativeWords: [],
	boostWords: [],
	negativeAccounts: [],
};

// Increment when the ranking/seen semantics change so previously generated
// snapshots and stale seen records cannot hide the corrected result set.
const recommendationCacheVersion = 'v14';

type RecommendationContext = {
	followingIds: string[];
	twoHopRows: { userId: string; socialProof: string }[];
	reactionAffinity: Array<[string, number]>;
	favoriteAffinity: Array<[string, number]>;
	renoteAffinity: Array<[string, number]>;
};

export const meta = {
	tags: ['notes'],
	requireCredential: true,
	kind: 'read:account',
	errors: {
		featureDisabled: {
			message: 'Recommended timeline is disabled.',
			code: 'FEATURE_DISABLED',
			id: '871d7f45-09fc-42ab-9060-9fd05d8f38dd',
		},
		notAllowed: {
			message: 'Recommended timeline is not available for this user.',
			code: 'FEATURE_NOT_AVAILABLE',
			id: 'bd49fd24-aae2-482f-93ea-f62fa0c878b8',
		},
	},
	res: {
		type: 'array', optional: false, nullable: false,
		items: { type: 'object', optional: false, nullable: false, ref: 'Note' },
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
		untilId: { type: 'string', format: 'misskey:id' },
		snapshotId: { type: 'string', minLength: 8, maxLength: 128 },
		previousSnapshotId: { type: 'string', minLength: 8, maxLength: 128 },
		previousIncludeFollowing: { type: 'boolean', default: true },
		includeFollowing: { type: 'boolean', default: true },
		withFiles: { type: 'boolean', default: false },
		withSensitive: { type: 'boolean', default: true },
	},
	required: ['snapshotId'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.meta) private serverSettings: MiMeta,
		@Inject(DI.notesRepository) private notesRepository: NotesRepository,
		@Inject(DI.followingsRepository) private followingsRepository: FollowingsRepository,
		@Inject(DI.driveFilesRepository) private driveFilesRepository: DriveFilesRepository,
		@Inject(DI.noteReactionsRepository) private noteReactionsRepository: NoteReactionsRepository,
		@Inject(DI.noteFavoritesRepository) private noteFavoritesRepository: NoteFavoritesRepository,
		@Inject(DI.redis) private redisClient: Redis.Redis,
		@Inject(DI.redisForTimelines) private redisForTimelines: Redis.Redis,
		private queryService: QueryService,
		private noteEntityService: NoteEntityService,
		private idService: IdService,
	) {
		super(meta, paramDef, async (ps, me) => {
			if (!this.serverSettings.enableRecommendedTimeline) throw new ApiError(meta.errors.featureDisabled);
			const allowedUserIds = this.serverSettings.recommendedTimelineAllowedUserIds ?? [];
			if (allowedUserIds.length > 0 && !allowedUserIds.includes(me.id)) throw new ApiError(meta.errors.notAllowed);
			const settings = this.settings();
			// Home-eligible notes are always scored as recommendation candidates. Keep
			// accepting the former request parameters for older clients, but never let
			// them create a separate discovery-only result set.
			const resultKey = `torikago:recommended:${recommendationCacheVersion}:snapshot:${me.id}:${ps.snapshotId}:home`;
			let resultIds = await this.redisClient.lrange(resultKey, 0, -1);
			if (resultIds.length === 0) {
				// The host has a known midnight load spike. Do not make a reader wait
				// for a fresh ranking if the browser already has a usable snapshot:
				// carry that fixed snapshot forward instead. Returning an empty array
				// here used to render "No notes" for every reader during the protected window.
				const previousResultKey = ps.previousSnapshotId == null ? null : `torikago:recommended:${recommendationCacheVersion}:snapshot:${me.id}:${ps.previousSnapshotId}:home`;
				const previousResultIds = previousResultKey == null ? [] : await this.redisClient.lrange(previousResultKey, 0, -1);
				if (this.isMidnightProtectionWindow() && previousResultKey != null && previousResultIds.length > 0) {
					const previousSeenIds = await this.redisClient.smembers(`${previousResultKey}:seen`);
					const pipeline = this.redisClient.pipeline().del(resultKey);
					pipeline.rpush(resultKey, ...previousResultIds);
					pipeline.expire(resultKey, settings.snapshotHours * 3600);
					pipeline.set(`${resultKey}:candidate-cursor`, '0', 'EX', settings.snapshotHours * 3600);
					pipeline.set(`${resultKey}:version`, (await this.redisForTimelines.get('torikago:recommended:version')) ?? '0', 'EX', settings.snapshotHours * 3600);
					if (previousSeenIds.length > 0) pipeline.sadd(`${resultKey}:seen`, ...previousSeenIds);
					pipeline.expire(`${resultKey}:seen`, settings.snapshotHours * 3600);
					await pipeline.exec();
					resultIds = previousResultIds;
				} else {
					// A first-time reader has no snapshot to reuse. Generate one rather
					// than presenting an empty timeline; this is request-driven, not a
					// midnight-wide background job.
					resultIds = await this.buildRecommendation(me, settings, new Set(), 0, settings.resultLimit, ps.snapshotId);
					const pipeline = this.redisClient.pipeline().del(resultKey);
					if (resultIds.length > 0) pipeline.rpush(resultKey, ...resultIds);
					pipeline.expire(resultKey, settings.snapshotHours * 3600);
					pipeline.set(`${resultKey}:candidate-cursor`, '0', 'EX', settings.snapshotHours * 3600);
					pipeline.set(`${resultKey}:version`, (await this.redisForTimelines.get('torikago:recommended:version')) ?? '0', 'EX', settings.snapshotHours * 3600);
					await pipeline.exec();
				}
			}

			// Cache version v8 only creates snapshots after target-note de-duplication,
			// so an extra DB pass to repair legacy snapshot lists is no longer needed.
			const offset = ps.untilId == null ? 0 : Math.max(0, resultIds.indexOf(ps.untilId) + 1);
			let pageIds = resultIds.slice(offset, offset + ps.limit * 8);
			// Reaching the end of a snapshot is the only time scrolling performs more
			// ranking. The existing IDs remain fixed, so the reader never sees items
			// move or duplicate while loading older entries.
			if (ps.untilId != null && pageIds.length < ps.limit) {
				const existingNotes = resultIds.length === 0 ? [] : await this.notesRepository.find({ select: { id: true, renoteId: true, userId: true, text: true, cw: true }, where: { id: In(resultIds) } });
				const existingTargets = new Set(existingNotes.map(note => this.targetId(note)));
				const existingAuthorCounts = new Map<string, number>();
				for (const note of existingNotes) {
					existingAuthorCounts.set(note.userId, (existingAuthorCounts.get(note.userId) ?? 0) + 1);
				}
				const cursorKey = `${resultKey}:candidate-cursor`;
				const cursor = Number(await this.redisClient.get(cursorKey) ?? '0');
				const batchSize = Math.min(60, Math.max(ps.limit * 2, 30));
				const extraIds = await this.buildRecommendation(me, settings, existingTargets, Math.max(0, cursor) * settings.candidateScanLimit, batchSize, ps.snapshotId, existingAuthorCounts);
				if (extraIds.length > 0) {
					// Multiple widgets or Deck columns may share this snapshot. Append only
					// when its length is unchanged, so concurrent end-of-list requests can
					// never append the same ranking batch twice.
					const appended = await this.redisClient.eval(`
						if redis.call('LLEN', KEYS[1]) ~= tonumber(ARGV[1]) then return 0 end
						redis.call('RPUSH', KEYS[1], unpack(ARGV, 4))
						redis.call('SET', KEYS[2], ARGV[2], 'EX', ARGV[3])
						redis.call('EXPIRE', KEYS[1], ARGV[3])
						return 1
					`, 2, resultKey, cursorKey, String(resultIds.length), String(cursor + 1), String(settings.snapshotHours * 3600), ...extraIds);
					if (appended === 1) resultIds.push(...extraIds);
					else resultIds = await this.redisClient.lrange(resultKey, 0, -1);
					pageIds = resultIds.slice(offset, offset + ps.limit * 8);
				}
			}
			if (pageIds.length === 0) return [];
			const notes = await this.notesRepository.find({
				where: { id: In(pageIds) },
				relations: { user: true, reply: { user: true }, renote: { user: true } },
			});
			const files = await this.driveFilesRepository.find({
				select: { id: true, isSensitive: true },
				where: { id: In([...new Set(notes.flatMap(note => note.fileIds))]) },
			});
			const sensitiveFileIds = new Set(files.filter(file => file.isSensitive).map(file => file.id));
			const noteMap = new Map(notes.map(note => [note.id, note]));
			const [snapshotSeenIds, globallySeenIds] = await Promise.all([
				this.redisClient.smembers(`${resultKey}:seen`),
				this.redisClient.zrangebyscore(`torikago:recommended:${recommendationCacheVersion}:seen:${me.id}`, Date.now() - settings.seenDays * 86400000, '+inf'),
			]);
			const snapshotSeen = new Set(snapshotSeenIds);
			const globallySeen = new Set(globallySeenIds);
			// The same fixed snapshot must remain readable while moving between views,
			// but a later snapshot must never reintroduce a note already delivered by
			// another snapshot. This second guard also closes the generation race where
			// two refreshes rank candidates before either response has recorded them.
			const ordered = pageIds.map(id => noteMap.get(id)).filter(note => note != null)
				.filter(note => {
					const targetId = this.targetId(note);
					return snapshotSeen.has(targetId) || !globallySeen.has(targetId);
				})
				.filter(note => ps.withSensitive || !note.fileIds.some(id => sensitiveFileIds.has(id))).slice(0, ps.limit);
			// A page returned to the client is the smallest reliable approximation of
			// "seen". Never consume an entire snapshot merely because it was replaced.
			await this.markSeen(me.id, resultKey, ordered.map(note => this.targetId(note)), settings);
			return await this.noteEntityService.packMany(ordered, me);
		});
	}

	private isMidnightProtectionWindow(): boolean {
		const now = new Date();
		return now.getHours() === 0 && now.getMinutes() < 1;
	}

	private settings(): Settings {
		const raw = this.serverSettings.recommendedTimelineSettings ?? {};
		const integer = (key: keyof Settings, min: number, max: number) => {
			const value = raw[key];
			return typeof value === 'number' && Number.isFinite(value) ? Math.min(max, Math.max(min, Math.floor(value))) : defaults[key] as number;
		};
		const unboundedInteger = (key: keyof Settings, min: number) => {
			const value = raw[key];
			const integerValue = typeof value === 'number' && Number.isFinite(value) ? Math.floor(value) : null;
			return integerValue != null && Number.isSafeInteger(integerValue) ? Math.max(min, integerValue) : defaults[key] as number;
		};
		const strings = (key: keyof Settings) => Array.isArray(raw[key]) ? raw[key].filter((x): x is string => typeof x === 'string').slice(0, 100) : defaults[key] as string[];
		return {
			candidatePoolLimit: unboundedInteger('candidatePoolLimit', 100), candidateScanLimit: integer('candidateScanLimit', 30, 200), resultLimit: integer('resultLimit', 20, 100),
			snapshotHours: integer('snapshotHours', 1, 168), seenDays: integer('seenDays', 1, 30), seenLimit: integer('seenLimit', 100, 5000),
			twoHopPercent: integer('twoHopPercent', 0, 100), followingPercent: integer('followingPercent', 0, 100), unknownPercent: integer('unknownPercent', 0, 100),
			qualityPercent: integer('qualityPercent', 0, 100), balancedPercent: integer('balancedPercent', 0, 100), freshPercent: integer('freshPercent', 0, 100),
			maxNotesPerAuthor: integer('maxNotesPerAuthor', 1, 10), publicBonus: integer('publicBonus', 0, 100), localUserBonus: integer('localUserBonus', 0, 100), reactionBonus: integer('reactionBonus', 0, 100), boostBonus: integer('boostBonus', 0, 100), sensitivePenalty: integer('sensitivePenalty', 0, 100), botPenalty: integer('botPenalty', 0, 100),
			twoHopRenoteBonus: integer('twoHopRenoteBonus', 0, 100), negativePenalty: integer('negativePenalty', 0, 100), minimumScore: integer('minimumScore', -100, 100), fallbackMaxAgeDays: integer('fallbackMaxAgeDays', 7, 365), forcedLimit: integer('forcedLimit', 0, 20),
			forcedAccounts: strings('forcedAccounts'), negativeWords: strings('negativeWords'), boostWords: strings('boostWords'), negativeAccounts: strings('negativeAccounts'),
		};
	}

	private async buildRecommendation(me: MiLocalUser, settings: Settings, excludedTargets = new Set<string>(), candidateOffset = 0, resultLimit = settings.resultLimit, seed = '', existingAuthorCounts = new Map<string, number>()): Promise<string[]> {
		const candidateIds = await this.redisForTimelines.lrange('torikago:recommended:candidates', candidateOffset, candidateOffset + settings.candidateScanLimit - 1);
		const context = await this.getRecommendationContext(me, settings);
		const followingIds = context.followingIds;
		const directIds = followingIds;
		const twoHopRows = context.twoHopRows;
		const twoHopIds = twoHopRows.map(row => row.userId);
		if (candidateIds.length === 0 && directIds.length === 0 && twoHopIds.length === 0) return [];

		const reactionAffinity = new Map(context.reactionAffinity);
		const favoriteAffinity = new Map(context.favoriteAffinity);
		const renoteAffinity = new Map(context.renoteAffinity);
		const directSet = new Set(directIds);
		const twoHopProof = new Map(twoHopRows.map(row => [row.userId, Number(row.socialProof)]));
		const createVisibleQuery = (limit = settings.candidateScanLimit) => {
			const query = this.notesRepository.createQueryBuilder('note').innerJoinAndSelect('note.user', 'user').leftJoinAndSelect('note.reply', 'reply').leftJoinAndSelect('reply.user', 'replyUser').leftJoinAndSelect('note.renote', 'renote').leftJoinAndSelect('renote.user', 'renoteUser')
				.andWhere('note.channelId IS NULL').orderBy('note.id', 'DESC').take(limit);
			this.queryService.generateVisibilityQuery(query, me);
			this.queryService.generateBaseNoteFilteringQuery(query, me);
			this.queryService.generateMutedUserRenotesQueryForNotes(query, me);
			return query;
		};
		// Keep Home and discovery retrieval independent. A busy global candidate pool
		// must not crowd out followed accounts before scoring. Followed posts remain a
		// normal recommendation source even when the explicit Home mix is off.
		// A bounded per-source fetch makes the result genuinely personal even when
		// the shared Redis candidate pool is dominated by a busy relay. The cap is
		// intentionally small: ranking needs a varied shortlist, not every note
		// written by every followed account.
		const sourceNoteLimit = Math.min(settings.candidateScanLimit, Math.max(60, resultLimit * 3));
		// The two-hop graph is ordered by the number of followed accounts that
		// connect the reader to each author. Query the wider, socially strongest
		// cohort independently from the shared pool, while keeping a bounded scan.
		const prioritizedTwoHopIds = twoHopIds;
		const twoHopFetchLimit = Math.min(300, Math.max(sourceNoteLimit, resultLimit * 4));
		const fetchDirectNotes = (days: number) => directIds.length === 0 ? Promise.resolve([]) : createVisibleQuery(sourceNoteLimit)
			.andWhere('note.userId = ANY(:directIds)', { directIds })
			.andWhere('note.id >= :oldestId', { oldestId: this.idService.gen(Date.now() - days * 86400000) })
			.getMany();
		const fetchTwoHopNotes = (days: number) => prioritizedTwoHopIds.length === 0 ? Promise.resolve([]) : createVisibleQuery(twoHopFetchLimit)
			.andWhere('note.userId = ANY(:twoHopIds)', { twoHopIds: prioritizedTwoHopIds })
			.andWhere('note.visibility = \'public\'')
			.andWhere('note.id >= :oldestId', { oldestId: this.idService.gen(Date.now() - days * 86400000) })
			// Subsequent scroll batches inspect older notes from the same strong social
			// cohort. The final selector enforces maxNotesPerAuthor across the snapshot.
			.skip(Math.max(0, candidateOffset))
			.getMany();
		const [sharedNotes, initialDirectNotes, initialTwoHopNotes] = await Promise.all([
			candidateIds.length > 0 ? createVisibleQuery().andWhere('note.id = ANY(:candidateIds)', { candidateIds }).getMany() : [],
			fetchDirectNotes(7),
			fetchTwoHopNotes(7),
		]);
		let directNotes = initialDirectNotes;
		let twoHopNotes = initialTwoHopNotes;
		const sourceTarget = (percent: number) => {
			const total = settings.twoHopPercent + settings.followingPercent + settings.unknownPercent;
			return percent === 0 ? 0 : Math.max(1, Math.ceil(resultLimit * percent / Math.max(total, 1)));
		};
		// Most requests inspect only the recent week. When a quiet period leaves a
		// personalised source below its configured share, widen only that source in
		// stages. This avoids turning every recommendation request into a 90-day scan.
		for (const days of [...new Set([30, settings.fallbackMaxAgeDays])].filter(days => days > 7)) {
			const [olderDirect, olderTwoHop] = await Promise.all([
				directNotes.length < sourceTarget(settings.followingPercent) ? fetchDirectNotes(days) : Promise.resolve([]),
				twoHopNotes.length < sourceTarget(settings.twoHopPercent) ? fetchTwoHopNotes(days) : Promise.resolve([]),
			]);
			directNotes = [...new Map([...directNotes, ...olderDirect].map(note => [note.id, note])).values()];
			twoHopNotes = [...new Map([...twoHopNotes, ...olderTwoHop].map(note => [note.id, note])).values()];
			if (directNotes.length >= sourceTarget(settings.followingPercent) && twoHopNotes.length >= sourceTarget(settings.twoHopPercent)) break;
		}
		const noteLists = [sharedNotes, directNotes, twoHopNotes];
		const notes = [...new Map(noteLists.flat().map(note => [note.id, note])).values()].sort((a, b) => b.id.localeCompare(a.id));
		// A plain renote is displayed as its original, so include the original's
		// files when evaluating the sensitive-file penalty as well.
		const fileIds = [...new Set(notes.flatMap(note => [...note.fileIds, ...(note.renote?.fileIds ?? [])]))];
		const sensitiveFileIds = new Set((await this.driveFilesRepository.find({ select: { id: true }, where: { id: In(fileIds), isSensitive: true } })).map(file => file.id));
		const seen = new Set(await this.redisClient.zrangebyscore(`torikago:recommended:${recommendationCacheVersion}:seen:${me.id}`, Date.now() - settings.seenDays * 86400000, '+inf'));
		const forcedWords = (this.serverSettings.recommendedTimelineForcedWords ?? []).map(word => word.toLocaleLowerCase());
		const now = Date.now();
		const normalizedAccounts = (accounts: string[]) => new Set(accounts.map(x => x.trim().replace(/^@/, '').toLocaleLowerCase()).filter(Boolean));
		const forcedAccounts = normalizedAccounts(settings.forcedAccounts);
		const negativeAccounts = normalizedAccounts(settings.negativeAccounts);
		const negativeWords = settings.negativeWords.map(word => word.toLocaleLowerCase());
		const boostWords = settings.boostWords.map(word => word.toLocaleLowerCase());
		const accountName = (note: typeof notes[number]) => `${note.user?.username ?? ''}${note.user?.host ? `@${note.user.host}` : ''}`.toLocaleLowerCase();
		const scored = notes.filter(note => !seen.has(this.targetId(note)) && !excludedTargets.has(this.targetId(note))).flatMap(note => {
			const source = directSet.has(note.userId) ? 'following' : twoHopProof.has(note.userId) ? 'twoHop' : 'unknown';
			// A renote with no own text or CW is the only form that may be replaced
			// with its original. Quote posts retain their wrapper and commentary.
			const plainRenote = note.renote != null && (note.text == null || note.text === '') && (note.cw == null || note.cw === '');
			// We only expose a renote's original when it is public. Non-public
			// originals are skipped rather than leaking their content through a
			// recommendation.
			if (plainRenote && note.renote?.visibility !== 'public') return [];
			const plainPublicRenote = plainRenote && note.renote?.visibility === 'public';
			const pureTwoHopRenote = source === 'twoHop' && plainPublicRenote;
			// Keep the renoter as the social signal, but score the note the reader
			// will actually see. Quotes intentionally retain their own wrapper here.
			const rankingNote = plainRenote ? note.renote! : note;
			// Do not recommend the reader's own post. This also covers a public
			// original that another account has purely renoted.
			if (rankingNote.userId === me.id) return [];
			const reactions = Object.values(rankingNote.reactions).reduce((sum, count) => sum + count, 0);
			const ageHours = Math.max(0, (now - this.idService.parse(rankingNote.id).date.getTime()) / 3600000);
			const freshness = Math.pow(0.5, ageHours / 8);
			const text = `${rankingNote.cw ?? ''}\n${rankingNote.text ?? ''}`.toLocaleLowerCase();
			const isForced = forcedWords.some(word => text.includes(word)) || forcedAccounts.has(accountName(rankingNote));
			const negative = negativeWords.some(word => text.includes(word)) || negativeAccounts.has(accountName(rankingNote));
			const boosted = boostWords.some(word => text.includes(word));
			// A pure renote is a recommendation signal; show its public original
			// directly so the reader does not see a redundant renote wrapper.
			const displayId = plainRenote ? note.renoteId! : note.id;
			const quality = 4 * Math.log1p(twoHopProof.get(note.userId) ?? 0) + 5 * Math.log1p(reactionAffinity.get(note.userId) ?? 0) + 6 * Math.log1p(renoteAffinity.get(note.userId) ?? 0) + 4 * Math.log1p(favoriteAffinity.get(note.userId) ?? 0) + settings.reactionBonus * Math.log1p(reactions) + 1.5 * Math.log1p(rankingNote.renoteCount) + (rankingNote.visibility === 'public' ? settings.publicBonus : 0) + (rankingNote.user?.host == null ? settings.localUserBonus : 0) + (pureTwoHopRenote ? settings.twoHopRenoteBonus : 0) + (boosted ? settings.boostBonus : 0) - (rankingNote.fileIds.some(id => sensitiveFileIds.has(id)) ? settings.sensitivePenalty : 0) - (rankingNote.user?.isBot ? settings.botPenalty : 0) - (negative ? settings.negativePenalty : 0);
			return [{ id: note.id, displayId, targetId: this.targetId(note), authorId: rankingNote.userId, source, forced: isForced, quality, freshness, balanced: quality + freshness * 4 }];
		});
		// A plain renote and its original note represent one thing to the reader.
		// Keep the stronger candidate before splitting forced and regular slots.
		const uniqueScored = [...scored].sort((a, b) => b.quality - a.quality).filter((item, index, items) => items.findIndex(other => other.targetId === item.targetId) === index);
		const selectedAuthorCounts = new Map(existingAuthorCounts);
		const forced: typeof uniqueScored = [];
		for (const item of uniqueScored) {
			if (!item.forced || forced.length >= settings.forcedLimit) continue;
			if ((selectedAuthorCounts.get(item.authorId) ?? 0) >= settings.maxNotesPerAuthor) continue;
			selectedAuthorCounts.set(item.authorId, (selectedAuthorCounts.get(item.authorId) ?? 0) + 1);
			forced.push(item);
		}
		const forcedTargets = new Set(forced.map(item => item.targetId));
		// Forced entries bypass the threshold, but every ordinary source uses the
		// configured minimum score consistently, including followed accounts.
		const eligible = uniqueScored.filter(item => item.forced || item.quality >= settings.minimumScore);
		const selectionSettings = { ...settings, resultLimit: Math.max(0, resultLimit - forced.length) };
		const selected = this.selectSources(eligible.filter(item => !item.forced && !forcedTargets.has(item.targetId)), selectionSettings, seed, selectedAuthorCounts);
		for (const item of selected) {
			selectedAuthorCounts.set(item.authorId, (selectedAuthorCounts.get(item.authorId) ?? 0) + 1);
		}
		// Source selection normally honours the configured ratios, but a depleted
		// source can fall back to another list while iterating. Do not let that
		// fallback erase the followed-account share when visible Home/followers
		// notes actually exist for the reader.
		const wantedFollowing = sourceTarget(settings.followingPercent);
		const selectedFollowing = selected.filter(item => item.source === 'following').length;
		if (selectedFollowing < wantedFollowing) {
			const selectedTargets = new Set(selected.map(item => item.targetId));
			const replacements = eligible
				.filter(item => item.source === 'following' && !item.forced && !forcedTargets.has(item.targetId) && !selectedTargets.has(item.targetId))
				.sort((a, b) => b.quality - a.quality)
				.slice(0, wantedFollowing - selectedFollowing);
			for (const replacement of replacements) {
				// Do not consume the reserved two-hop share merely to fill the followed
				// share. Unknown slots are the fallback space for either personalised source.
				const replaceAt = selected.map(item => item.source === 'unknown').lastIndexOf(true);
				if (replaceAt < 0) break;
				const replaced = selected[replaceAt]!;
				const replacedCount = selectedAuthorCounts.get(replaced.authorId) ?? 0;
				selectedAuthorCounts.set(replaced.authorId, Math.max(0, replacedCount - 1));
				if ((selectedAuthorCounts.get(replacement.authorId) ?? 0) >= settings.maxNotesPerAuthor) {
					selectedAuthorCounts.set(replaced.authorId, replacedCount);
					continue;
				}
				selected[replaceAt] = replacement;
				selectedAuthorCounts.set(replacement.authorId, (selectedAuthorCounts.get(replacement.authorId) ?? 0) + 1);
			}
		}
		// Home-eligible notes are scored and interleaved with every other source;
		// they are no longer inserted as an independent chronological Home segment.
		const regular = this.interleave(selected, settings, seed);
		return [...forced, ...regular].slice(0, resultLimit).map(item => item.displayId);
	}

	private async getRecommendationContext(me: MiLocalUser, settings: Settings): Promise<RecommendationContext> {
		const key = `torikago:recommended:${recommendationCacheVersion}:context:${me.id}`;
		const cached = await this.redisClient.get(key);
		if (cached != null) {
			try {
				const context = JSON.parse(cached) as RecommendationContext;
				if (Array.isArray(context.followingIds) && Array.isArray(context.twoHopRows) && Array.isArray(context.reactionAffinity) && Array.isArray(context.favoriteAffinity) && Array.isArray(context.renoteAffinity)) return context;
			} catch {
				// Rebuild a malformed or obsolete cache entry.
			}
		}

		const followingIds = (await this.followingsRepository.find({ select: { followeeId: true }, where: { followerId: me.id } })).map(row => row.followeeId);
		const twoHopContextLimit = Math.min(500, Math.max(80, settings.candidateScanLimit * 4));
		const twoHopRows: { userId: string; socialProof: string }[] = followingIds.length === 0 ? [] : await this.followingsRepository.createQueryBuilder('following')
			.select('following.followeeId', 'userId').addSelect('COUNT(*)', 'socialProof')
			.where('following.followerId IN (:...followingIds)', { followingIds }).andWhere('following.followeeId != :meId', { meId: me.id })
			.andWhere('following.followeeId NOT IN (:...followingIds)', { followingIds }).groupBy('following.followeeId').orderBy('COUNT(*)', 'DESC').limit(twoHopContextLimit).getRawMany();
		// Affinity queries stay bounded even though the retrieval pool is wider.
		// Social-proof scoring remains available for every two-hop row.
		const authorIds = [...new Set([me.id, ...followingIds, ...twoHopRows.slice(0, 80).map(row => row.userId)])];
		const [reactionRows, favoriteRows, renoteRows] = authorIds.length === 0 ? [[], [], []] : await Promise.all([
			this.noteReactionsRepository.createQueryBuilder('reaction').innerJoin('reaction.note', 'target').select('target.userId', 'userId').addSelect('COUNT(*)', 'count').where('reaction.userId = :meId', { meId: me.id }).andWhere('target.userId IN (:...authorIds)', { authorIds }).groupBy('target.userId').getRawMany<{ userId: string; count: string }>(),
			this.noteFavoritesRepository.createQueryBuilder('favorite').innerJoin('favorite.note', 'target').select('target.userId', 'userId').addSelect('COUNT(*)', 'count').where('favorite.userId = :meId', { meId: me.id }).andWhere('target.userId IN (:...authorIds)', { authorIds }).groupBy('target.userId').getRawMany<{ userId: string; count: string }>(),
			this.notesRepository.createQueryBuilder('ownRenote').innerJoin('ownRenote.renote', 'target').select('target.userId', 'userId').addSelect('COUNT(*)', 'count').where('ownRenote.userId = :meId', { meId: me.id }).andWhere('ownRenote.id >= :oldestId', { oldestId: this.idService.gen(Date.now() - 90 * 86400000) }).andWhere('target.userId IN (:...authorIds)', { authorIds }).groupBy('target.userId').getRawMany<{ userId: string; count: string }>(),
		]);
		const context: RecommendationContext = {
			followingIds,
			twoHopRows,
			reactionAffinity: reactionRows.map(row => [row.userId, Number(row.count)]),
			favoriteAffinity: favoriteRows.map(row => [row.userId, Number(row.count)]),
			renoteAffinity: renoteRows.map(row => [row.userId, Number(row.count)]),
		};
		await this.redisClient.set(key, JSON.stringify(context), 'EX', 300);
		return context;
	}

	private selectSources<T extends { id: string; source: string; authorId: string; targetId: string; quality: number }>(items: T[], settings: Settings, seed: string, existingAuthorCounts = new Map<string, number>()): T[] {
		const bySource = new Map(['following', 'twoHop', 'unknown'].map(source => [source, items.filter(item => item.source === source).sort((a, b) => b.quality - a.quality)]));
		const percentages: Array<[string, number]> = [['twoHop', settings.twoHopPercent], ['following', settings.followingPercent], ['unknown', settings.unknownPercent]];
		if (percentages.every(([, percent]) => percent === 0)) percentages[0]![1] = 100;
		const out: T[] = []; const counts = new Map(existingAuthorCounts); const targets = new Set<string>();
		for (let i = 0; i < settings.resultLimit; i++) {
			const wanted = [...percentages].sort((a, b) => ((out.filter(item => item.source === a[0]).length + 1) / Math.max(a[1], 1)) - ((out.filter(item => item.source === b[0]).length + 1) / Math.max(b[1], 1)))[0]![0];
			const sources = [wanted, ...percentages.map(x => x[0]).filter(source => source !== wanted)];
			let picked: T | undefined;
			for (const source of sources) {
				const list = bySource.get(source) ?? [];
				const eligible = list.filter(item => !targets.has(item.targetId) && (counts.get(item.authorId) ?? 0) < settings.maxNotesPerAuthor);
				if (eligible.length > 0) {
					// Sampling from the stronger portion rather than always taking rank 1
					// prevents every snapshot from having the same score-heavy head.
					const windowSize = Math.max(1, Math.ceil(eligible.length * 0.6));
					picked = eligible[Math.floor(this.seededRandom(`${seed}:source:${source}:${i}`) * windowSize)]!;
					list.splice(list.indexOf(picked), 1);
					break;
				}
			}
			if (picked == null) break;
			out.push(picked); targets.add(picked.targetId); counts.set(picked.authorId, (counts.get(picked.authorId) ?? 0) + 1);
		}
		return out;
	}

	private interleave<T extends { id: string; quality: number; freshness: number; balanced: number }>(items: T[], settings: Settings, seed: string): T[] {
		const pools = { quality: [...items].sort((a, b) => b.quality - a.quality), balanced: [...items].sort((a, b) => b.balanced - a.balanced), fresh: [...items].sort((a, b) => b.freshness - a.freshness) };
		const ratioTotal = settings.qualityPercent + settings.balancedPercent + settings.freshPercent || 100;
		const counts = {
			quality: Math.round(10 * settings.qualityPercent / ratioTotal),
			balanced: Math.round(10 * settings.balancedPercent / ratioTotal),
			fresh: Math.round(10 * settings.freshPercent / ratioTotal),
		};
		while (counts.quality + counts.balanced + counts.fresh < 10) counts.quality++;
		while (counts.quality + counts.balanced + counts.fresh > 10) {
			const largest = [...(['quality', 'balanced', 'fresh'] as const)].sort((a, b) => counts[b] - counts[a])[0]!;
			counts[largest]--;
		}
		const output: T[] = []; const used = new Set<T>(); const order: (keyof typeof pools)[] = [];
		while (order.length < 10) {
			for (const type of ['quality', 'balanced', 'fresh'] as const) {
				if (counts[type] > order.filter(x => x === type).length) order.push(type);
			}
		}
		for (const [index, type] of order.entries()) {
			const candidates = pools[type].filter(item => !used.has(item));
			if (candidates.length === 0) continue;
			// Draw independently from each score/freshness category. The seed keeps
			// pagination stable while avoiding a concentration of the top-ranked
			// notes at the beginning of every response.
			const windowSize = Math.max(1, Math.ceil(candidates.length * 0.6));
			const item = candidates[Math.floor(this.seededRandom(`${seed}:display:${type}:${index}`) * windowSize)]!;
			output.push(item);
			used.add(item);
		}
		// The first slots preserve a deliberate quality/freshness mix. Shuffle the
		// remaining eligible items with a snapshot-stable seed so lower-scored notes
		// are not deterministically relegated to the bottom on every refresh.
		const remaining = pools.balanced.filter(item => !used.has(item)).map(item => ({ item, random: this.seededRandom(`${seed}:${item.id}`) }))
			.sort((a, b) => a.random - b.random).map(({ item }) => item);
		output.push(...remaining);
		return output;
	}

	private seededRandom(value: string): number {
		let hash = 2166136261;
		for (let i = 0; i < value.length; i++) {
			hash ^= value.charCodeAt(i);
			hash = Math.imul(hash, 16777619);
		}
		return (hash >>> 0) / 0x100000000;
	}

	private targetId(note: { id: string; renoteId: string | null; text?: string | null; cw?: string | null }): string {
		return note.renoteId != null && (note.text == null || note.text === '') && (note.cw == null || note.cw === '') ? note.renoteId : note.id;
	}

	private async markSeen(userId: string, resultKey: string, noteIds: string[], settings: Settings): Promise<void> {
		if (noteIds.length === 0) return;
		const key = `torikago:recommended:${recommendationCacheVersion}:seen:${userId}`;
		const now = Date.now();
		const pipeline = this.redisClient.pipeline();
		for (const id of noteIds) pipeline.zadd(key, now, id);
		pipeline.sadd(`${resultKey}:seen`, ...noteIds);
		pipeline.expire(`${resultKey}:seen`, settings.snapshotHours * 3600);
		pipeline.zremrangebyscore(key, 0, now - settings.seenDays * 86400000);
		pipeline.expire(key, settings.seenDays * 86400);
		await pipeline.exec();
		const count = await this.redisClient.zcard(key);
		if (count > settings.seenLimit) await this.redisClient.zremrangebyrank(key, 0, count - settings.seenLimit - 1);
	}
}

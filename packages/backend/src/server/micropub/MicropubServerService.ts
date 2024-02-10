/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as stream from 'node:stream/promises';
import * as querystring from 'node:querystring';
import * as parse5 from 'parse5';
import * as mfm from 'mfm-js';
import ms from 'ms';
import Ajv from 'ajv';
import { In, Not, IsNull } from 'typeorm';
import { Injectable, Inject, type OnApplicationShutdown } from '@nestjs/common';
import formbody from '@fastify/formbody';
import multipart from '@fastify/multipart';
import { format as dateFormat } from 'date-fns';
import Logger from '@/logger.js';
import { type Config } from '@/config.js';
import type { MiDriveFile, MiUser, MiNote, MiAccessToken, BlockingsRepository, UsersRepository, ChannelsRepository, NotesRepository, DriveFilesRepository } from '@/models/_.js';
import { bindThis } from '@/decorators.js';
import { IdService } from '@/core/IdService.js';
import { MfmService } from '@/core/MfmService.js';
import { RoleService } from '@/core/RoleService.js';
import { DriveService } from '@/core/DriveService.js';
import { LoggerService } from '@/core/LoggerService.js';
import { FileInfoService } from '@/core/FileInfoService.js';
import { DownloadService } from '@/core/DownloadService.js';
import { NoteCreateService } from '@/core/NoteCreateService.js';
import { NoteDeleteService } from '@/core/NoteDeleteService.js';
import { RateLimiterService } from '@/server/api/RateLimiterService.js';
import { AuthenticateService } from '@/server/api/AuthenticateService.js';
import { correctFilename } from '@/misc/correct-filename.js';
import { createTemp } from '@/misc/create-temp.js';
import { isPureRenote } from '@/misc/is-pure-renote.js';
import type { SchemaType } from '@/misc/json-schema.js';
import { MAX_NOTE_TEXT_LENGTH } from '@/const.js';
import { DI } from '@/di-symbols.js';
import * as TreeAdapter from '../../../node_modules/parse5/dist/tree-adapters/default.js';
import type { FastifyInstance, FastifyReply } from 'fastify';

type ValueOf<T> = T[keyof T];
type MediaImage = { source: string, alt: string } | string;
type MediaRawSource = { path: string, filename: string };
type MediaRawSources = { photo: MediaRawSource[], audio: MediaRawSource[], video: MediaRawSource[] };
type MediaSource = { photos: MediaImage[], audios: string[], videos: string[] };
type MicropubRequest = { h?: string, media?: MediaRawSources, action?: string, url?: string, body: unknown, coalition: string };
type NoteCreateOptions = {
	content: (string | { html: string })[],
	cw?: string,
	photos?: ({ alt: string, value: string } | string)[],
	audios?: string[],
	videos?: string[],
	renote?: { id?: string },
	channel?: { id?: string },
	published?: string[],
	category?: string[],
	visibility?: string,
	localOnly?: boolean,
	reactionAcceptance?: MiNote['reactionAcceptance'],
	visibleUsers?: string[],
}

const errorSymbols = {
	FORBIDDEN: Symbol('FORBIDDEN'),
	UNAUTHORIZED: Symbol('UNAUTHORIZED'),
	BAD_REQUEST: Symbol('BAD_REQUEST'),
	INSUFFICIENT_SCOPE: Symbol('INSUFFICIENT_SCOPE'),
};

const mergeSymbols = {
	MERGE_ADD: Symbol('MERGE_ADD'),
	MERGE_REPLACE: Symbol('MERGE_REPLACE'),
	MERGE_DELETE: Symbol('MERGE_DELETE'),
};

const misskeyGeneralSchema = {
	published: { type: 'array', items: { type: 'string', format: 'iso-date-time' } },
	content: { type: 'array', items: { oneOf: [
		{ type: 'object', properties: { html: { type: 'string', minLength: 1, maxLength: MAX_NOTE_TEXT_LENGTH } }, required: ['html'] },
		{ type: 'string', minLength: 1, maxLength: MAX_NOTE_TEXT_LENGTH },
	] } },
	photos: { type: 'array', items: { oneOf: [
		{ type: 'object', properties: { alt: { type: 'string' }, value: { type: 'string', format: 'url' } }, required: ['alt', 'value'] },
		{ type: 'string', format: 'url' },
	] } },
	audios: { type: 'array', items: { type: 'string', format: 'url' } },
	videos: { type: 'array', items: { type: 'string', format: 'url' } },
	category: { type: 'array', items: { type: 'string' } },
	'misskey-visible-users': { type: 'array', items: { type: 'string' } },
	'misskey-cw': { type: 'array', minItems: 1, maxItems: 1, items: { type: 'string', minLength: 1, maxLength: 100 } },
	'misskey-reaction-acceptance': { type: 'array', minItems: 1, maxItems: 1, items: { type: 'string', enum: [null, 'likeOnly', 'likeOnlyForRemote', 'nonSensitiveOnly', 'nonSensitiveOnlyForLocalLikeOnlyForRemote'] } },
	'misskey-channel-id': { type: 'array', minItems: 1, maxItems: 1, items: { type: 'string' } },
	'misskey-renote-id': { type: 'array', minItems: 1, maxItems: 1, items: { type: 'string' } },
	'misskey-local-only': { type: 'array', minItems: 1, maxItems: 1, items: { type: 'boolean' } },
	'misskey-visibility': { type: 'array', minItems: 1, maxItems: 1, items: { type: 'string', enum: ['public', 'home', 'followers', 'specified'] } },
} as const;

const IS_X_WWW_FORM_URLENCODED = Symbol('IS_X_WWW_FORM_URLENCODED');
const treeAdapter = TreeAdapter.defaultTreeAdapter;
const validator = new Ajv.default({ coerceTypes: 'array' });
validator.addFormat('url', { type: 'string', validate: URL.canParse });
// Taken from https://github.com/ajv-validator/ajv-formats/blob/master/src/formats.ts#L112-L115
validator.addFormat('iso-date-time', /^\d\d\d\d-[0-1]\d-[0-3]\d[t\s](?:[0-2]\d:[0-5]\d:[0-5]\d|23:59:60)(?:\.\d+)?(?:z|[+-]\d\d(?::?\d\d)?)?$/i);
const createNoteSchema = { type: 'object', properties: misskeyGeneralSchema, required: ['content'] } as const;
const updateNoteSchema = { type: 'object', properties: misskeyGeneralSchema, required: [] } as const;
const validateIsCreatingNote = validator.compile(createNoteSchema);
const validateIsUpdatingNote = validator.compile(updateNoteSchema);

class MicropubError extends Error {
	public errorTypes: ValueOf<typeof errorSymbols>;
	public description: string | null;

	constructor(errorTypes: ValueOf<typeof errorSymbols>, description?: string) {
		super(description);
		this.errorTypes = errorTypes;
		this.description = description ?? null;
	}
}

@Injectable()
export class MicropubServerService implements OnApplicationShutdown {
	#logger: Logger;
	#temporaryFileCleaners: Map<string, (() => void)[]>;

	constructor(
		@Inject(DI.config)
		private config: Config,
		@Inject(DI.notesRepository)
		private notesRepository: NotesRepository,
		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,
		@Inject(DI.channelsRepository)
		private channelsRepository: ChannelsRepository,
		@Inject(DI.driveFilesRepository)
		private driveFilesRepository: DriveFilesRepository,
		@Inject(DI.blockingsRepository)
		private blockingsRepository: BlockingsRepository,
		private idService: IdService,
		private mfmService: MfmService,
		private roleService: RoleService,
		private driveService: DriveService,
		private loggerService: LoggerService,
		private downloadService: DownloadService,
		private fileInfoService: FileInfoService,
		private noteCreateService: NoteCreateService,
		private noteDeleteService: NoteDeleteService,
		private rateLimiterService: RateLimiterService,
		private authenticateService: AuthenticateService,
	) {
		this.#temporaryFileCleaners = new Map();
		this.#logger = this.loggerService.getLogger('micropub');
	}

	// Retrieving media sources from HTML content.
	@bindThis
	private getMediaSourcesFromHTML(html: string): MediaSource {
		function analyzeNodes(nodes: TreeAdapter.Node[]): [MediaImage[], string[], string[]] {
			let photos: MediaImage[] = [];
			let audios: string[] = [];
			let videos: string[] = [];

			for (const node of nodes) {
				if (!treeAdapter.isElementNode(node)) continue;
				switch (node.nodeName) {
					case 'img': {
						const source = node.attrs.find(x => x.name === 'src');
						const alt = node.attrs.find(x => x.name === 'alt');
						if (!source) continue;
						photos = [...photos, alt ? { source: source.value, alt: alt.value } : source.value];
						break;
					}
					case 'video': {
						const source = node.attrs.find(x => x.name === 'src');
						if (!source) continue;
						videos = [...videos, source.value];
						break;
					}
					case 'audio': {
						const source = node.attrs.find(x => x.name === 'src');
						if (!source) continue;
						audios = [...audios, source.value];
						break;
					}
					default: {
						const result = analyzeNodes(node.childNodes);
						photos = [...photos, ...result[0]];
						audios = [...audios, ...result[1]];
						videos = [...videos, ...result[2]];
						break;
					}
				}
			}
			return [photos, audios, videos];
		}

		const rootNode = parse5.parseFragment(html);
		const [photos, audios, videos] = analyzeNodes(rootNode.childNodes);
		return { photos, audios, videos };
	}

	@bindThis
	private serializeNoteFromRequest(request: Partial<SchemaType<typeof createNoteSchema>>): Partial<NoteCreateOptions> {
		return {
			published: request.published,
			content: request.content,
			photos: request.photos,
			audios: request.audios,
			videos: request.videos,
			category: request.category,
			cw: request['misskey-cw']?.at(0),
			renote: { id: request['misskey-renote-id']?.at(0) },
			channel: { id: request['misskey-channel-id']?.at(0) },
			visibility: request['misskey-visibility']?.at(0),
			localOnly: request['misskey-local-only']?.at(0),
			reactionAcceptance: request['misskey-reaction-acceptance']?.at(0),
			visibleUsers: request['misskey-visible-users'],
		};
	}

	@bindThis
	private serializeRequestFromNote(note: NoteCreateOptions): SchemaType<typeof createNoteSchema> {
		return {
			published: note.published,
			// @ts-expect-error error: 'The expected type comes from property 'content' which is declared here on type {...}'
			content: note.content,
			// @ts-expect-error error: 'The expected type comes from property 'photos' which is declared here on type {...}'
			photos: note.photos,
			audios: note.audios,
			videos: note.videos,
			category: note.category,
			'misskey-cw': note.cw ? [note.cw] : undefined,
			'misskey-renote-id': note.renote?.id ? [note.renote.id] : undefined,
			'misskey-channel-id': note.channel?.id ? [note.channel.id] : undefined,
			'misskey-visibility': note.visibility ? [<any>note.visibility] : undefined,
			'misskey-local-only': note.localOnly ? [note.localOnly] : undefined,
			'misskey-reaction-acceptance': note.reactionAcceptance ? [note.reactionAcceptance] : undefined,
			'misskey-visible-users': note.visibleUsers,
		};
	}

	@bindThis
	private async serializeOptionsFromDatabase(note: MiNote, verbose = false): Promise<NoteCreateOptions> {
		const markdown = note.text ? mfm.parse(note.text) : undefined;
		const text = markdown ? mfm.toString(mfm.extract(markdown, (node) => node.type !== 'hashtag')) : undefined;
		const driveFiles = await this.driveFilesRepository.findBy({ id: In(note.fileIds) });
		const files = driveFiles.map(file => ({
			mime: file.type,
			alt: file.comment,
			url: file.downloadedFrom ?? new URL('/files/' + file.accessKey ? encodeURIComponent(file.accessKey!) : '', this.config.url).toString(),
		}));

		return {
			...(verbose ? { published: [this.idService.parse(note.id).date.toISOString()] } : {}),
			cw: note.cw ?? undefined,
			content: text ? [text.trimEnd()] : [],
			renote: { id: note.renoteId ?? undefined },
			channel: { id: note.channelId ?? undefined },
			category: note.tags,
			visibility: note.visibility,
			localOnly: note.localOnly,
			reactionAcceptance: note.reactionAcceptance ?? undefined,
			visibleUsers: note.visibleUserIds.length > 0 ? note.visibleUserIds : undefined,
			photos: files.filter(file => file.mime.startsWith('image')).map(file => file.alt ? { alt: file.alt, value: file.url } : file.url),
			audios: files.filter(file => file.mime.startsWith('audio')).map(file => file.url),
			videos: files.filter(file => file.mime.startsWith('video')).map(file => file.url),
		};
	}

	@bindThis
	private sendMicropubApiError(error: unknown, reply: FastifyReply) {
		function sendApiError(code: number, error: string, description: string | null, reply: FastifyReply) {
			reply.code(code);
			return reply.send({ error, ...(description ? { error_description: description } : {}) });
		}

		if (error instanceof MicropubError) {
			switch (error.errorTypes) {
				case errorSymbols.FORBIDDEN: return sendApiError(403, 'forbidden', error.description, reply);
				case errorSymbols.UNAUTHORIZED: return sendApiError(401, 'unauthorized', error.description, reply);
				case errorSymbols.BAD_REQUEST: return sendApiError(400, 'invalid_request', error.description, reply);
				case errorSymbols.INSUFFICIENT_SCOPE: return sendApiError(403, 'insufficient_scope', error.description, reply);
			}
		}

		if (process.env.NODE_ENV === 'production') return sendApiError(400, 'invalid_request', 'Intenal server error occurred', reply);
		return sendApiError(400, 'invalid_request', `Intenal server error occurred: ${JSON.stringify(error, Object.getOwnPropertyNames(error))}`, reply);
	}

	@bindThis
	private async createNote(user: MiUser, options: NoteCreateOptions, coalition: string, rawMedia?: MediaRawSources): Promise<{ noteId: MiNote['id'] }> {
		let message = options.content.map(m => typeof m === 'object' && 'html' in m ? this.mfmService.fromHtml(m.html) : m).join('\n');
		const published = options.published && options.published.length > 0 ? new Date(options.published[0]) : new Date();
		const html = options.content.reduce<string>((a, b) => typeof b === 'object' && 'html' in b ? a + b.html : a, '');
		let { photos, audios, videos } = html ? this.getMediaSourcesFromHTML(html) : { photos: [], audios: [], videos: [] };
		photos = [...photos, ...(options.photos ?? []).map(photo => typeof photo === 'string' ? photo : { source: photo.value, alt: photo.alt })];
		audios = [...audios, ...(options.audios ?? [])];
		videos = [...videos, ...(options.videos ?? [])];
		message += options.category && options.category.length > 0 ? ' ' + options.category.map(hashtag => `#${hashtag}`).join(' ') : '';
		const media = [...photos, ...audios, ...videos];
		let attachedMedia: MiDriveFile[] = [];

		for (const medium of media) {
			const source = typeof medium === 'string' ? medium : medium.source;
			const mediaUrl = new URL(source);
			if (mediaUrl.origin === this.config.url && mediaUrl.pathname.startsWith('/files/')) {
				const accessKey = decodeURIComponent(mediaUrl.pathname.slice(7));
				const driveFile = await this.driveFilesRepository.createQueryBuilder('file')
					.where('file.accessKey = :accessKey', { accessKey })
					.orWhere('file.thumbnailAccessKey = :thumbnailAccessKey', { thumbnailAccessKey: accessKey })
					.orWhere('file.webpublicAccessKey = :webpublicAccessKey', { webpublicAccessKey: accessKey })
					.getOne();
				if (driveFile === null) throw new MicropubError(errorSymbols.BAD_REQUEST, `Cannot access to ${medium}`);
				attachedMedia = [...attachedMedia, driveFile];
			} else {
				const [destPath, cleanup] = await createTemp();
				this.#temporaryFileCleaners.set(coalition, [...(this.#temporaryFileCleaners.get(coalition) ?? []), cleanup]);
				await this.downloadService.downloadUrl(source, destPath);
				const extension = await this.fileInfoService.detectType(destPath);
				const filename = correctFilename('micropub-' + dateFormat(new Date(), 'yyyy-MM-ddHH-mm-ss'), extension.ext);
				const driveFile = await this.driveService.addFile({
					user,
					path: destPath,
					name: filename,
					force: true,
					micropub: true,
					ext: extension.ext,
					comment: typeof medium === 'object' && 'alt' in medium ? medium.alt : undefined,
					downloadedFrom: mediaUrl.toString(),
				});
				attachedMedia = [...attachedMedia, driveFile];
			}
		}

		if (typeof rawMedia !== 'undefined') {
			for (const medium of [...rawMedia.photo, ...rawMedia.audio, ...rawMedia.video]) {
				const driveFile = await this.driveService.addFile({ user, path: medium.path, name: path.parse(medium.filename).name });
				attachedMedia = [...attachedMedia, driveFile];
			}
		}

		const visibleUsers = options.visibleUsers ? await this.usersRepository.findBy({ id: In(options.visibleUsers) }) : null;
		const renote = options.renote?.id ? await this.notesRepository.findOneBy({ id: options.renote.id }) : null;
		const channel = options.channel?.id ? await this.channelsRepository.findOneBy({ id: options.channel.id }) : null;
		if (options.renote?.id && !renote) throw new MicropubError(errorSymbols.BAD_REQUEST, 'Cannot find channel');
		if (options.channel?.id && !channel) throw new MicropubError(errorSymbols.BAD_REQUEST, `Cannot find note (id: ${options.channel.id})`);

		if (renote !== null) {
			if (renote.userId !== user.id) {
				const blockExists = await this.blockingsRepository.existsBy({ blockerId: renote.userId, blockeeId: user.id });
				if (blockExists) throw new MicropubError(errorSymbols.BAD_REQUEST, 'You have been blocked by this user');
			}
			if (isPureRenote(renote)) throw new MicropubError(errorSymbols.BAD_REQUEST, 'Cannot renote a pure renote');
			if (renote.visibility === 'followers' && renote.userId !== user.id) throw new MicropubError(errorSymbols.BAD_REQUEST);
			if (renote.visibility === 'specified') throw new MicropubError(errorSymbols.BAD_REQUEST);
			if (renote.channelId && renote.channelId !== options.channel?.id) {
				const renoteChannel = await this.channelsRepository.findOneBy({ id: renote.channelId });
				if (renoteChannel === null) throw new MicropubError(errorSymbols.BAD_REQUEST, 'Cannot find channel');
				if (!renoteChannel.allowRenoteToExternal) throw new MicropubError(errorSymbols.BAD_REQUEST, 'Cannot renote outside of channel');
			}
		}

		const note = await this.noteCreateService.create(user, {
			...options,
			createdAt: published,
			files: attachedMedia,
			text: message,
			renote,
			channel,
			visibleUsers,
		});

		return { noteId: note.id };
	}

	@bindThis
	private mergeNote<T extends Record<string, unknown>>(strategy: ValueOf<typeof mergeSymbols>, firstNote: T, secondNote: Partial<T>): T {
		const outputNote: T = firstNote;

		if (strategy === mergeSymbols.MERGE_ADD) {
			for (const [key, value] of Object.entries(secondNote)) {
				if (Array.isArray(value)) {
					if (!Array.isArray(firstNote[key])) continue;
					Reflect.set(outputNote, key, [...<unknown[]>firstNote[key], ...value]);
				} else if (typeof value === 'object') {
					if (typeof firstNote[key] !== 'object' && value !== null) continue;
					Reflect.set(outputNote, key, this.mergeNote(mergeSymbols.MERGE_ADD, <Record<string, unknown>>firstNote[key], value));
				} else if (typeof value !== 'undefined') {
					if (typeof firstNote[key] !== 'undefined') continue;
					Reflect.set(outputNote, key, value);
				}
			}
		} else if (strategy === mergeSymbols.MERGE_REPLACE) {
			for (const [key, value] of Object.entries(secondNote)) {
				if (typeof value === 'object' && !Array.isArray(value)) {
					if (typeof firstNote[key] !== 'object' || Array.isArray(firstNote[key])) continue;
					Reflect.set(outputNote, key, this.mergeNote(mergeSymbols.MERGE_REPLACE, <Record<string, unknown>>firstNote[key], value));
				} else if (typeof value !== 'undefined') {
					if (typeof firstNote[key] === 'undefined' || typeof firstNote[key] !== typeof value) continue;
					Reflect.set(outputNote, key, value);
				}
			}
		} else if (strategy === mergeSymbols.MERGE_DELETE) {
			for (const [key, value] of Object.entries(secondNote)) {
				if (typeof value === 'object' && !Array.isArray(value)) {
					if (typeof firstNote[key] !== 'object') continue;
					Reflect.set(outputNote, key, this.mergeNote(mergeSymbols.MERGE_DELETE, <Record<string, unknown>>firstNote[key], value));
				} else if (Array.isArray(value)) {
					if (!Array.isArray(firstNote[key])) continue;
					Reflect.set(outputNote, key, (<unknown[]>firstNote[key]).filter(v => {
						const normalized = value.map(v => URL.canParse(v) ? new URL(v).toString() : v);
						return !normalized.includes(v);
					}));
				}
			}
		}

		return outputNote;
	}

	@bindThis
	private async deleteNote(user: MiUser, note: MiNote) {
		const files = await this.driveFilesRepository.findBy({
			id: In(note.fileIds),
			userId: user.id,
			downloadedFrom: Not(IsNull()),
			createdByMicropub: true,
		});

		await Promise.all(files.map(file => this.driveService.deleteFile(file)));
		await this.noteDeleteService.delete(user, note);
	}

	@bindThis
	private async handleRequest(request: MicropubRequest, user: MiUser, app: MiAccessToken | null, reply: FastifyReply) {
		if (request.h === 'entry') {
			const valid = validateIsCreatingNote(request.body);
			const message = `${validateIsCreatingNote.errors?.at(0)?.schemaPath}: ${validateIsCreatingNote.errors?.at(0)?.message}`;
			if (!valid) throw new MicropubError(errorSymbols.BAD_REQUEST, message);
			if (app && !app.permission.includes('write:notes')) throw new MicropubError(errorSymbols.INSUFFICIENT_SCOPE);
			const validated = request.body as SchemaType<typeof createNoteSchema>;
			const { noteId } = await this.createNote(user, { ...this.serializeNoteFromRequest(validated), content: validated.content }, request.coalition, request.media);
			reply.code(201 /* Created */);
			reply.header('Location', new URL('/notes/' + noteId, this.config.url));
			return await reply.send();
		} else if (typeof request.h !== 'undefined') {
			throw new MicropubError(errorSymbols.BAD_REQUEST, 'Request format should be h-entry');
		} else if (request.action === 'delete') {
			if (typeof request.url !== 'string') throw new MicropubError(errorSymbols.BAD_REQUEST);
			const noteUrl = new URL(request.url);
			if (app && !app.permission.includes('write:notes')) throw new MicropubError(errorSymbols.INSUFFICIENT_SCOPE);
			if (noteUrl.origin !== this.config.url || !noteUrl.pathname.startsWith('/notes/')) throw new MicropubError(errorSymbols.BAD_REQUEST);
			const noteId = noteUrl.pathname.slice(7);
			const note = await this.notesRepository.findOneBy({ id: noteId, userId: user.id });
			if (note === null) throw new MicropubError(errorSymbols.BAD_REQUEST);
			await this.deleteNote(user, note);
			return await reply.send();
		} else if (request.action === 'update') {
			if (typeof request.url !== 'string') throw new MicropubError(errorSymbols.BAD_REQUEST);
			if (app && !app.permission.includes('write:notes')) throw new MicropubError(errorSymbols.INSUFFICIENT_SCOPE);
			const noteUrl = new URL(request.url);
			if (noteUrl.origin !== this.config.url || !noteUrl.pathname.startsWith('/notes/')) throw new MicropubError(errorSymbols.BAD_REQUEST);
			const noteId = noteUrl.pathname.slice(7);
			const note = await this.notesRepository.findOneBy({ id: noteId, userId: user.id });
			if (note === null) throw new MicropubError(errorSymbols.BAD_REQUEST, `Cannot find note (id: ${noteId}`);
			const body = request.body as { add?: unknown, replace?: unknown, delete?: unknown };
			let options = await this.serializeOptionsFromDatabase(note);

			this.#logger.info(`Validating user input... [add: ${!!body.add}, replace: ${!!body.replace}, delete: ${!!body.delete}]`);

			if (typeof body.add !== 'undefined') {
				const valid = validateIsUpdatingNote(body.add);
				const message = `${validateIsUpdatingNote.errors?.at(0)?.schemaPath}: ${validateIsUpdatingNote.errors?.at(0)?.message}`;
				if (!valid) throw new MicropubError(errorSymbols.BAD_REQUEST, message);
				const overrideOptions = this.serializeNoteFromRequest(body.add as SchemaType<typeof updateNoteSchema>);
				options = this.mergeNote(mergeSymbols.MERGE_ADD, options, overrideOptions);
			}

			if (typeof body.replace !== 'undefined') {
				const valid = validateIsUpdatingNote(body.replace);
				const message = `${validateIsUpdatingNote.errors?.at(0)?.schemaPath}: ${validateIsUpdatingNote.errors?.at(0)?.message}`;
				if (!valid) throw new MicropubError(errorSymbols.BAD_REQUEST, message);
				const overrideOptions = this.serializeNoteFromRequest(body.replace as SchemaType<typeof updateNoteSchema>);
				options = this.mergeNote(mergeSymbols.MERGE_REPLACE, options, overrideOptions);
			}

			if (typeof body.delete === 'object' && !Array.isArray(body.delete)) {
				const valid = validateIsUpdatingNote(body.delete);
				const message = `${validateIsUpdatingNote.errors?.at(0)?.schemaPath}: ${validateIsUpdatingNote.errors?.at(0)?.message}`;
				if (!valid) throw new MicropubError(errorSymbols.BAD_REQUEST, message);
				const overrideOptions = this.serializeNoteFromRequest(body.delete as SchemaType<typeof updateNoteSchema>);
				options = this.mergeNote(mergeSymbols.MERGE_DELETE, options, overrideOptions);
			} else if (Array.isArray(body.delete)) {
				for (const key of body.delete) {
					if (key in options && key !== 'content') delete options[key as keyof NoteCreateOptions];
				}
			}

			this.#logger.info('Validating combined note...');
			const valid = validateIsCreatingNote(options);
			const message = `${validateIsCreatingNote.errors?.at(0)?.schemaPath}: ${validateIsCreatingNote.errors?.at(0)?.message}`;
			if (!valid) throw new MicropubError(errorSymbols.BAD_REQUEST, message);
			await this.deleteNote(user, note);
			const { noteId: createdNoteId } = await this.createNote(user, options, request.coalition);
			reply.code(201 /* Created */);
			reply.header('Location', new URL('/notes/' + createdNoteId, this.config.url));
			return await reply.send();
		}
		throw new MicropubError(errorSymbols.BAD_REQUEST);
	}

	@bindThis
	public async createServer(fastify: FastifyInstance) {
		fastify.register(formbody, {
			parser: (request) => {
				const params = querystring.parse(request);
				const transformed = {} as Record<string, unknown>;
				for (const [key, value] of Object.entries(params)) {
					if (typeof value !== 'undefined') {
						if (key.endsWith('[]')) {
							const strippedKey = key.slice(0, -2);
							transformed[strippedKey] = Array.isArray(value) ? value : [value];
						} else {
							transformed[key] = value;
						}
					}
				}
				return { ...transformed, [IS_X_WWW_FORM_URLENCODED]: true };
			},
		});

		fastify.register(multipart, {
			limits: {
				fileSize: this.config.maxFileSize ?? 262144000,
				files: 16,
			},
		});

		fastify.post<{
			Body?: {
				h?: string,
				url?: string,
				type?: string[],
				action?: string,
				access_token?: string | string[],
				[key: symbol]: unknown,
				[key: string]: unknown,
			},
			Headers: { authorization?: string }
		}>('/micropub', async (request, reply) => {
			try {
				const media: MediaRawSources = { photo: [], audio: [], video: [] };
				let params: any = {};

				if (request.isMultipart()) {
					for await (const part of request.parts()) {
						if (part.type === 'file') {
							if (/^(photo|audio|video)$/.test(part.fieldname)) {
								const fieldname = part.fieldname as keyof MediaRawSources;
								const [destPath, cleanup] = await createTemp();
								this.#temporaryFileCleaners.set(request.id, [...(this.#temporaryFileCleaners.get(request.id) ?? []), cleanup]);
								await stream.pipeline(part.file, fs.createWriteStream(destPath));
								media[fieldname] = [...media[fieldname], { path: destPath, filename: part.filename }];
							}
						} else {
							if (typeof part.value === 'string') {
								if (part.fieldname.endsWith('[]')) {
									const strippedKey = part.fieldname.slice(0, -2);
									const previous = Array.isArray(params[strippedKey]) ? params[strippedKey] :
										typeof params[strippedKey] !== 'undefined' ? [params[strippedKey]] : [];
									params[strippedKey] = [...previous, part.value];
								} else {
									params[part.fieldname] = part.value;
								}
							}
						}
					}
				} else if (request.body) {
					params = request.body.action === 'update' ? request.body :
						request.body.type ? request.body.properties :
						request.body[IS_X_WWW_FORM_URLENCODED] ? request.body : {};
				}

				const token = request.headers.authorization?.startsWith('Bearer ') ? request.headers.authorization.slice(7) :
					typeof request.body?.access_token !== 'undefined' ? request.body.access_token : params.access_token;
				if (typeof token !== 'string') throw new MicropubError(errorSymbols.UNAUTHORIZED);
				const [user, app] = await this.authenticateService.authenticate(token);
				if (user === null) throw new MicropubError(errorSymbols.UNAUTHORIZED);
				if (request.body?.type && request.body.type.at(0) !== 'h-entry') throw new MicropubError(errorSymbols.BAD_REQUEST);
				const factor = (await this.roleService.getUserPolicies(user.id)).rateLimitFactor;

				if (factor > 0) {
					await this.rateLimiterService.limit({
						key: 'micropub',
						max: 300,
						duration: ms('1 hour'),
					}, user.id, factor);
				}

				return await this.handleRequest({
					media,
					coalition: request.id,
					h: request.body?.type ? 'entry' : request.body?.h ?? params.h,
					action: request.body?.action ?? params.action,
					url: request.body?.url ?? params.url,
					body: params as unknown,
				}, user, app, reply);
			} catch (err) {
				return await this.sendMicropubApiError(err, reply);
			} finally {
				this.#temporaryFileCleaners.get(request.id)?.forEach(v => v());
				this.#temporaryFileCleaners.delete(request.id);
			}
		});

		fastify.get<{
			Querystring: {
				q?: string,
				url?: string,
				[key: string]: unknown,
			},
			Headers: { authorization?: string },
		}>('/micropub', async (request, reply) => {
			try {
				if (request.query.q === 'config') {
					return await reply.send({
						'media-endpoint': new URL('/micropub/media', this.config.url).toString(),
						'syndicate-to': [],
					});
				} else if (request.query.q === 'syndicate-to') {
					return await reply.send({ 'syndicate-to': [] });
				} else if (request.query.q === 'source') {
					const token = request.headers.authorization?.startsWith('Bearer ') ? request.headers.authorization.slice(7) : null;
					const properties = typeof request.query.properties === 'string' ? [request.query.properties] :
						Array.isArray(request.query['properties[]']) ? <string[]>request.query['properties[]'] : null;
					if (typeof request.query.url !== 'string') throw new MicropubError(errorSymbols.BAD_REQUEST);
					if (token === null) throw new MicropubError(errorSymbols.BAD_REQUEST);
					const [user, app] = await this.authenticateService.authenticate(token);
					if (user === null) throw new MicropubError(errorSymbols.UNAUTHORIZED);
					if (app && !app.permission.includes('read:account')) throw new MicropubError(errorSymbols.INSUFFICIENT_SCOPE);
					const noteUrl = new URL(request.query.url);
					if (noteUrl.origin !== this.config.url || !noteUrl.pathname.startsWith('/notes/')) throw new MicropubError(errorSymbols.BAD_REQUEST);
					const noteId = noteUrl.pathname.slice(7);
					const note = await this.notesRepository.findOneBy({ id: noteId, userId: user.id });
					if (note === null) throw new MicropubError(errorSymbols.BAD_REQUEST, `Cannot find note (id: ${noteId}`);
					const options = await this.serializeOptionsFromDatabase(note, true);
					const query = this.serializeRequestFromNote(options);
					const response = Object.keys(query)
						.filter(key => properties == null || properties.includes(key))
						.reduce((a, b) => ({ ...a, [b]: query[b as keyof typeof query] }), {});

					return await reply.send({
						...(properties === null ? { type: ['h-entry'] } : {}),
						properties: response,
					});
				} else {
					throw new MicropubError(errorSymbols.BAD_REQUEST);
				}
			} catch (err) {
				return await this.sendMicropubApiError(err, reply);
			}
		});

		fastify.post<{ Headers: { authorization?: string } }>('/media', async (request, reply) => {
			try {
				const multipartData = await request.file();
				const fields = {} as Record<string, unknown>;
				if (typeof multipartData === 'undefined') throw new MicropubError(errorSymbols.BAD_REQUEST);
				for (const [key, value] of Object.entries(multipartData.fields)) {
					fields[key] = typeof value === 'object' && 'value' in value ? value.value : undefined;
				}
				const token = request.headers.authorization?.startsWith('Bearer ') ? request.headers.authorization.slice(7) :
					typeof fields.access_token === 'string' ? fields.access_token : null;
				if (token === null) throw new MicropubError(errorSymbols.UNAUTHORIZED);
				const [user, app] = await this.authenticateService.authenticate(token);
				if (user === null) throw new MicropubError(errorSymbols.UNAUTHORIZED);
				if (app && !app.permission.includes('write:drive')) throw new MicropubError(errorSymbols.INSUFFICIENT_SCOPE);
				const [destPath, cleanup] = await createTemp();
				this.#temporaryFileCleaners.set(request.id, [...(this.#temporaryFileCleaners.get(request.id) ?? []), cleanup]);
				await stream.pipeline(multipartData.file, fs.createWriteStream(destPath));
				if (multipartData.fieldname !== 'file') throw new MicropubError(errorSymbols.BAD_REQUEST);
				const driveFile = await this.driveService.addFile({ user, path: destPath, name: path.parse(multipartData.filename).name, micropub: true, force: true });
				if (driveFile.accessKey === null) throw new MicropubError(errorSymbols.BAD_REQUEST, 'Internal server error: Accesskey is null');
				reply.code(201 /* Created */);
				reply.header('Location', new URL('/files/' + encodeURIComponent(driveFile.accessKey), this.config.url));
				return await reply.send();
			} catch (err) {
				return await this.sendMicropubApiError(err, reply);
			} finally {
				this.#temporaryFileCleaners.get(request.id)?.forEach(v => v());
				this.#temporaryFileCleaners.delete(request.id);
			}
		});
	}

	@bindThis // eslint-disable-next-line @typescript-eslint/no-unused-vars
	public onApplicationShutdown(signal?: string | undefined) {
		for (const cleaners of this.#temporaryFileCleaners.values()) {
			cleaners.forEach(v => v());
		}
	}
}

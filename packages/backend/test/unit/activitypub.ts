/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

process.env.NODE_ENV = 'test';

import * as assert from 'assert';
import * as fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import { describe, beforeAll, beforeEach, test, vi } from 'vitest';
import { Test } from '@nestjs/testing';

import { MockResolver } from '../misc/mock-resolver.js';
import type { IActor, IApDocument, ICollection, IObject, IPost } from '@/core/activitypub/type.js';
import type { MiRemoteUser } from '@/models/User.js';
import type { MiDriveFile } from '@/models/DriveFile.js';
import { ApImageService } from '@/core/activitypub/models/ApImageService.js';
import { extractQuoteLinkUris } from '@/core/activitypub/models/tag.js';
import { ApNoteService } from '@/core/activitypub/models/ApNoteService.js';
import { ApPersonService } from '@/core/activitypub/models/ApPersonService.js';
import { ApRendererService } from '@/core/activitypub/ApRendererService.js';
import { JsonLdService } from '@/core/activitypub/JsonLdService.js';
import { CONTEXT } from '@/core/activitypub/misc/contexts.js';
import { GlobalModule } from '@/GlobalModule.js';
import { CoreModule } from '@/core/CoreModule.js';
import { FederatedInstanceService } from '@/core/FederatedInstanceService.js';
import { LoggerService } from '@/core/LoggerService.js';
import { MiMeta, MiNote, UserProfilesRepository } from '@/models/_.js';
import { DI } from '@/di-symbols.js';
import { secureRndstr } from '@/misc/secure-rndstr.js';
import { DownloadService } from '@/core/DownloadService.js';
import { genAidx } from '@/misc/id/aidx.js';

const _filename = fileURLToPath(import.meta.url);
const _dirname = dirname(_filename);

const host = 'https://host1.test';

type NonTransientIActor = IActor & { id: string };
type NonTransientIPost = IPost & { id: string };

function createRandomActor({ actorHost = host } = {}): NonTransientIActor {
	const preferredUsername = secureRndstr(8);
	const actorId = `${actorHost}/users/${preferredUsername.toLowerCase()}`;

	return {
		'@context': 'https://www.w3.org/ns/activitystreams',
		id: actorId,
		type: 'Person',
		preferredUsername,
		inbox: `${actorId}/inbox`,
		outbox: `${actorId}/outbox`,
	};
}

function createRandomNote(actor: NonTransientIActor): NonTransientIPost {
	const id = secureRndstr(8);
	const noteId = `${new URL(actor.id).origin}/notes/${id}`;

	return {
		id: noteId,
		type: 'Note',
		attributedTo: actor.id,
		content: 'test test foo',
	};
}

function createRandomNotes(actor: NonTransientIActor, length: number): NonTransientIPost[] {
	return new Array(length).fill(null).map(() => createRandomNote(actor));
}

function createRandomFeaturedCollection(actor: NonTransientIActor, length: number): ICollection {
	const items = createRandomNotes(actor, length);

	return {
		'@context': 'https://www.w3.org/ns/activitystreams',
		type: 'Collection',
		id: actor.outbox as string,
		totalItems: items.length,
		items,
	};
}

async function createRandomRemoteUser(
	resolver: MockResolver,
	personService: ApPersonService,
): Promise<MiRemoteUser> {
	const actor = createRandomActor();
	resolver.register(actor.id, actor);

	return await personService.createPerson(actor.id, resolver);
}

describe('ActivityPub', () => {
	let userProfilesRepository: UserProfilesRepository;
	let imageService: ApImageService;
	let noteService: ApNoteService;
	let personService: ApPersonService;
	let rendererService: ApRendererService;
	let jsonLdService: JsonLdService;
	let resolver: MockResolver;

	const metaInitial = {
		cacheRemoteFiles: true,
		cacheRemoteSensitiveFiles: true,
		enableFanoutTimeline: true,
		enableFanoutTimelineDbFallback: true,
		perUserHomeTimelineCacheMax: 100,
		perLocalUserUserTimelineCacheMax: 100,
		perRemoteUserUserTimelineCacheMax: 100,
		blockedHosts: [] as string[],
		sensitiveWords: [] as string[],
		prohibitedWords: [] as string[],
	} as MiMeta;
	const meta = { ...metaInitial };

	function updateMeta(newMeta: Partial<MiMeta>): void {
		for (const key in meta) {
			delete (meta as any)[key];
		}
		Object.assign(meta, newMeta);
	}

	beforeAll(async () => {
		const app = await Test.createTestingModule({
			imports: [GlobalModule, CoreModule],
		})
			.overrideProvider(DownloadService).useValue({
				async downloadUrl(url: string, path: string): Promise<{ filename: string }> {
					if (url.endsWith('.png')) {
						fs.copyFileSync(
							_dirname + '/../resources/hw.png',
							path,
						);
					}
					return {
						filename: 'dummy.tmp',
					};
				},
			})
			.overrideProvider(DI.meta).useFactory({ factory: () => meta })
			.compile();

		await app.init();
		app.enableShutdownHooks();

		userProfilesRepository = app.get(DI.userProfilesRepository);

		noteService = app.get<ApNoteService>(ApNoteService);
		personService = app.get<ApPersonService>(ApPersonService);
		rendererService = app.get<ApRendererService>(ApRendererService);
		imageService = app.get<ApImageService>(ApImageService);
		jsonLdService = app.get<JsonLdService>(JsonLdService);
		resolver = new MockResolver(await app.resolve<LoggerService>(LoggerService));

		// Prevent ApPersonService from fetching instance, as it causes Jest import-after-test error
		const federatedInstanceService = app.get<FederatedInstanceService>(FederatedInstanceService);
		vi.spyOn(federatedInstanceService, 'fetch').mockImplementation(() => new Promise(() => { }));
	});

	beforeEach(() => {
		resolver.clear();
	});

	describe('Parse minimum object', () => {
		const actor = createRandomActor();

		const post = {
			'@context': 'https://www.w3.org/ns/activitystreams',
			id: `${host}/users/${secureRndstr(8)}`,
			type: 'Note',
			attributedTo: actor.id,
			to: 'https://www.w3.org/ns/activitystreams#Public',
			content: 'あ',
		};

		test('Minimum Actor', async () => {
			resolver.register(actor.id, actor);

			const user = await personService.createPerson(actor.id, resolver);

			assert.deepStrictEqual(user.uri, actor.id);
			assert.deepStrictEqual(user.username, actor.preferredUsername);
			assert.deepStrictEqual(user.inbox, actor.inbox);
		});

		test('Minimum Note', async () => {
			resolver.register(actor.id, actor);
			resolver.register(post.id, post);

			const note = await noteService.createNote(post.id, undefined, resolver, true);

			assert.deepStrictEqual(note?.uri, post.id);
			assert.deepStrictEqual(note.visibility, 'public');
			assert.deepStrictEqual(note.text, post.content);
		});
	});

	describe('Quote as object link', () => {
		const objectLinkMediaType = 'application/ld+json; profile="https://www.w3.org/ns/activitystreams"';

		function createQuotePair(quoteTag: (quotedUri: string) => IObject) {
			const actor = createRandomActor();
			const quoted = {
				'@context': 'https://www.w3.org/ns/activitystreams',
				id: `${host}/notes/${secureRndstr(8)}`,
				type: 'Note',
				attributedTo: actor.id,
				to: 'https://www.w3.org/ns/activitystreams#Public',
				content: 'quoted post',
			};
			const quoting = {
				'@context': 'https://www.w3.org/ns/activitystreams',
				id: `${host}/notes/${secureRndstr(8)}`,
				type: 'Note',
				attributedTo: actor.id,
				to: 'https://www.w3.org/ns/activitystreams#Public',
				content: 'quoting post',
				tag: [quoteTag(quoted.id)],
			};
			return { actor, quoted, quoting };
		}

		test('Note with only an object link (AS mediaType) is parsed as a quote', async () => {
			const { actor, quoted, quoting } = createQuotePair(quotedUri => ({
				type: 'Link',
				mediaType: objectLinkMediaType,
				href: quotedUri,
				name: `RE: ${quotedUri}`,
			}));
			resolver.register(actor.id, actor);
			resolver.register(quoted.id, quoted);
			resolver.register(quoting.id, quoting);

			const note = await noteService.createNote(quoting.id, undefined, resolver, true);

			assert.ok(note?.renoteId != null);
		});

		test('Note with an object link (application/activity+json) is parsed as a quote', async () => {
			const { actor, quoted, quoting } = createQuotePair(quotedUri => ({
				type: 'Link',
				mediaType: 'application/activity+json',
				href: quotedUri,
			}));
			resolver.register(actor.id, actor);
			resolver.register(quoted.id, quoted);
			resolver.register(quoting.id, quoting);

			const note = await noteService.createNote(quoting.id, undefined, resolver, true);

			assert.ok(note?.renoteId != null);
		});

		test('Note with an object link with _misskey_quote rel is parsed as a quote', async () => {
			const { actor, quoted, quoting } = createQuotePair(quotedUri => ({
				type: 'Link',
				mediaType: 'text/html',
				rel: 'https://misskey-hub.net/ns#_misskey_quote',
				href: quotedUri,
			} as IObject));
			resolver.register(actor.id, actor);
			resolver.register(quoted.id, quoted);
			resolver.register(quoting.id, quoting);

			const note = await noteService.createNote(quoting.id, undefined, resolver, true);

			assert.ok(note?.renoteId != null);
		});

		test('Only the first resolvable candidate is fetched (early exit)', async () => {
			const actor = createRandomActor();
			const quoted1 = {
				'@context': 'https://www.w3.org/ns/activitystreams',
				id: `${host}/notes/${secureRndstr(8)}`,
				type: 'Note',
				attributedTo: actor.id,
				to: 'https://www.w3.org/ns/activitystreams#Public',
				content: 'quoted post 1',
			};
			const quoted2 = {
				'@context': 'https://www.w3.org/ns/activitystreams',
				id: `${host}/notes/${secureRndstr(8)}`,
				type: 'Note',
				attributedTo: actor.id,
				to: 'https://www.w3.org/ns/activitystreams#Public',
				content: 'quoted post 2',
			};
			const quoting = {
				'@context': 'https://www.w3.org/ns/activitystreams',
				id: `${host}/notes/${secureRndstr(8)}`,
				type: 'Note',
				attributedTo: actor.id,
				to: 'https://www.w3.org/ns/activitystreams#Public',
				content: 'quoting post',
				tag: [quoted1.id, quoted2.id].map(href => ({
					type: 'Link',
					mediaType: objectLinkMediaType,
					href,
				})),
			};
			resolver.register(actor.id, actor);
			resolver.register(quoted1.id, quoted1);
			resolver.register(quoted2.id, quoted2);
			resolver.register(quoting.id, quoting);

			const note = await noteService.createNote(quoting.id, undefined, resolver, true);

			assert.ok(note?.renoteId != null);
			// 最初の候補で解決が成立したら、残りの候補は fetch されない
			assert.ok(resolver.remoteGetTrials().includes(quoted1.id));
			assert.ok(!resolver.remoteGetTrials().includes(quoted2.id));
		});

		test('extractQuoteLinkUris caps the number of candidates (DoS prevention)', () => {
			const links = Array.from({ length: 100 }, (_, i) => ({
				type: 'Link',
				mediaType: objectLinkMediaType,
				href: `https://host2.test/notes/${i}`,
			}));

			const uris = extractQuoteLinkUris(links);

			assert.ok(uris.length <= 4);
			assert.deepStrictEqual(uris[0], 'https://host2.test/notes/0');
		});

		test('An unrelated link tag is not parsed as a quote', async () => {
			const { actor, quoted, quoting } = createQuotePair(() => ({
				type: 'Link',
				mediaType: 'text/html',
				href: 'https://example.com/somewhere',
			}));
			resolver.register(actor.id, actor);
			resolver.register(quoted.id, quoted);
			resolver.register(quoting.id, quoting);

			const note = await noteService.createNote(quoting.id, undefined, resolver, true);

			assert.deepStrictEqual(note?.renoteId, null);
		});

		test('renderNote emits an object link for a quote', async () => {
			const { actor, quoted, quoting } = createQuotePair(quotedUri => ({
				type: 'Link',
				mediaType: objectLinkMediaType,
				href: quotedUri,
			}));
			resolver.register(actor.id, actor);
			resolver.register(quoted.id, quoted);
			resolver.register(quoting.id, quoting);

			const note = await noteService.createNote(quoting.id, undefined, resolver, true);
			assert.ok(note != null);

			const rendered = await rendererService.renderNote(note, false);
			const links = (Array.isArray(rendered.tag) ? rendered.tag : [rendered.tag]).filter((t): t is IObject => t != null && typeof t === 'object' && (t as IObject).type === 'Link');

			assert.deepStrictEqual(links.length, 1);
			assert.deepStrictEqual((links[0] as IObject).href, quoted.id);
			assert.deepStrictEqual((links[0] as IObject).mediaType, objectLinkMediaType);
		});
	});

	describe('Parse quote (FEP-044f)', () => {
		function createQuotePair(quoteProps: (quotedUri: string) => Partial<IPost>) {
			const actor = createRandomActor();
			const quoted = {
				'@context': 'https://www.w3.org/ns/activitystreams',
				id: `${host}/notes/${secureRndstr(8)}`,
				type: 'Note',
				attributedTo: actor.id,
				to: 'https://www.w3.org/ns/activitystreams#Public',
				content: 'quoted post',
			};
			const quoting = {
				'@context': 'https://www.w3.org/ns/activitystreams',
				id: `${host}/notes/${secureRndstr(8)}`,
				type: 'Note',
				attributedTo: actor.id,
				to: 'https://www.w3.org/ns/activitystreams#Public',
				content: 'quoting post',
				...quoteProps(quoted.id),
			};
			return { actor, quoted, quoting };
		}

		test('Note with FEP-044f quote property (without legacy props) is parsed as a quote', async () => {
			const { actor, quoted, quoting } = createQuotePair(quotedUri => ({ quote: quotedUri }));
			resolver.register(actor.id, actor);
			resolver.register(quoted.id, quoted);
			resolver.register(quoting.id, quoting);

			const note = await noteService.createNote(quoting.id, undefined, resolver, true);

			assert.ok(note?.renoteId != null);
			assert.deepStrictEqual(note.quoteAuthorizationUri, null);
		});

		test('quoteAuthorization is stored without verification', async () => {
			const stampUri = `${host}/users/alice/stamps/1`;
			const { actor, quoted, quoting } = createQuotePair(quotedUri => ({
				quote: quotedUri,
				_misskey_quote: quotedUri,
				quoteUrl: quotedUri,
				quoteAuthorization: stampUri,
			}));
			resolver.register(actor.id, actor);
			resolver.register(quoted.id, quoted);
			resolver.register(quoting.id, quoting);

			const note = await noteService.createNote(quoting.id, undefined, resolver, true);

			assert.ok(note?.renoteId != null);
			assert.deepStrictEqual(note.quoteAuthorizationUri, stampUri);
		});

		test('Unstamped legacy quote is still accepted (compatibility)', async () => {
			const { actor, quoted, quoting } = createQuotePair(quotedUri => ({ _misskey_quote: quotedUri, quoteUrl: quotedUri }));
			resolver.register(actor.id, actor);
			resolver.register(quoted.id, quoted);
			resolver.register(quoting.id, quoting);

			const note = await noteService.createNote(quoting.id, undefined, resolver, true);

			assert.ok(note?.renoteId != null);
			assert.deepStrictEqual(note.quoteAuthorizationUri, null);
		});
	});

	describe('Name field', () => {
		test('Truncate long name', async () => {
			const actor = {
				...createRandomActor(),
				name: secureRndstr(129),
			};

			resolver.register(actor.id, actor);

			const user = await personService.createPerson(actor.id, resolver);

			assert.deepStrictEqual(user.name, actor.name.slice(0, 128));
		});

		test('Normalize empty name', async () => {
			const actor = {
				...createRandomActor(),
				name: '',
			};

			resolver.register(actor.id, actor);

			const user = await personService.createPerson(actor.id, resolver);

			assert.strictEqual(user.name, null);
		});
	});

	describe('alsoKnownAs field', () => {
		test('Handle alsoKnownAs as an array', async () => {
			const actor = {
				...createRandomActor(),
				alsoKnownAs: ['https://example.com/users/alice', 'https://example.com/users/alice2'],
			};

			resolver.register(actor.id, actor);

			const user = await personService.createPerson(actor.id, resolver);

			assert.deepStrictEqual(user.alsoKnownAs, actor.alsoKnownAs);
		});

		test('Handle alsoKnownAs as a string', async () => {
			const actor = {
				...createRandomActor(),
				alsoKnownAs: 'https://example.com/users/alice',
			};

			resolver.register(actor.id, actor);

			const user = await personService.createPerson(actor.id, resolver);

			assert.deepStrictEqual(user.alsoKnownAs, [actor.alsoKnownAs]);
		});

		test('Update person with alsoKnownAs as a string', async () => {
			const actor = createRandomActor();
			resolver.register(actor.id, actor);
			const user = await personService.createPerson(actor.id, resolver);

			const updatedActor = {
				...actor,
				alsoKnownAs: 'https://example.com/users/alice',
			};
			resolver.register(actor.id, updatedActor);

			await personService.updatePerson(actor.id, resolver, updatedActor);

			const updatedUser = await personService.fetchPerson(actor.id);
			assert.deepStrictEqual(updatedUser?.alsoKnownAs, [updatedActor.alsoKnownAs]);
		});
	});

	describe('Collection visibility', () => {
		test('Public following/followers', async () => {
			const actor = createRandomActor();
			actor.following = {
				id: `${actor.id}/following`,
				type: 'OrderedCollection',
				totalItems: 0,
				first: `${actor.id}/following?page=1`,
			};
			actor.followers = `${actor.id}/followers`;

			resolver.register(actor.id, actor);
			resolver.register(actor.followers, {
				id: actor.followers,
				type: 'OrderedCollection',
				totalItems: 0,
				first: `${actor.followers}?page=1`,
			});

			const user = await personService.createPerson(actor.id, resolver);
			const userProfile = await userProfilesRepository.findOneByOrFail({ userId: user.id });

			assert.deepStrictEqual(userProfile.followingVisibility, 'public');
			assert.deepStrictEqual(userProfile.followersVisibility, 'public');
		});

		test('Private following/followers', async () => {
			const actor = createRandomActor();
			actor.following = {
				id: `${actor.id}/following`,
				type: 'OrderedCollection',
				totalItems: 0,
				// first: …
			};
			actor.followers = `${actor.id}/followers`;

			resolver.register(actor.id, actor);
			//resolver.register(actor.followers, { … });

			const user = await personService.createPerson(actor.id, resolver);
			const userProfile = await userProfilesRepository.findOneByOrFail({ userId: user.id });

			assert.deepStrictEqual(userProfile.followingVisibility, 'private');
			assert.deepStrictEqual(userProfile.followersVisibility, 'private');
		});
	});

	describe('Renderer', () => {
		test('Render an announce with visibility: followers', () => {
			rendererService.renderAnnounce('https://example.com/notes/00example', {
				id: genAidx(Date.now()),
				visibility: 'followers',
			} as MiNote);
		});

		function createDummyLocalNote(override: Partial<MiNote> = {}): MiNote {
			return {
				id: genAidx(Date.now()),
				userId: 'xxxxxxxx',
				userHost: null,
				visibility: 'public',
				localOnly: false,
				text: 'test',
				cw: null,
				replyId: null,
				renoteId: null,
				mentions: [],
				mentionedRemoteUsers: '[]',
				tags: [],
				fileIds: [],
				emojis: [],
				hasPoll: false,
				quoteAuthorizationUri: null,
				quoteRejected: false,
				...override,
			} as MiNote;
		}

		test('Render a public note with FEP-044f interaction policy', async () => {
			const rendered = await rendererService.renderNote(createDummyLocalNote(), false);

			assert.deepStrictEqual(rendered.interactionPolicy, {
				canQuote: {
					automaticApproval: ['https://www.w3.org/ns/activitystreams#Public'],
				},
			});
		});

		test('Do not render interaction policy for a followers-only note', async () => {
			const rendered = await rendererService.renderNote(createDummyLocalNote({ visibility: 'followers' }), false);

			assert.deepStrictEqual(rendered.interactionPolicy, undefined);
		});

		test('genQuoteAuthorizationUrl round-trip', () => {
			const quotingUri = 'https://host2.test/notes/abcdef123';
			const url = rendererService.genQuoteAuthorizationUrl('9aaaaaaaaa', quotingUri);
			const token = url.split('/').at(-1)!;

			assert.ok(url.includes('/notes/9aaaaaaaaa/quote-authorization/'));
			assert.deepStrictEqual(Buffer.from(token, 'base64url').toString('utf-8'), quotingUri);
		});

		test('renderQuoteAuthorization does not embed interactingObject', () => {
			const quotingUri = 'https://host2.test/notes/abcdef123';
			const quotedNote = createDummyLocalNote();
			const auth = rendererService.renderQuoteAuthorization(quotedNote, quotingUri);

			assert.deepStrictEqual(auth.type, 'QuoteAuthorization');
			assert.deepStrictEqual(auth.id, rendererService.genQuoteAuthorizationUrl(quotedNote.id, quotingUri));
			assert.deepStrictEqual(auth.interactingObject, quotingUri);
			assert.deepStrictEqual(typeof auth.interactingObject, 'string');
		});
	});

	describe('Featured', () => {
		test('Fetch featured notes from IActor', async () => {
			const actor = createRandomActor();
			actor.featured = `${actor.id}/collections/featured`;

			const featured = createRandomFeaturedCollection(actor, 5);

			resolver.register(actor.id, actor);
			resolver.register(actor.featured, featured);

			await personService.createPerson(actor.id, resolver);

			// All notes in `featured` are same-origin, no need to fetch notes again
			assert.deepStrictEqual(resolver.remoteGetTrials(), [actor.id, actor.featured]);

			// Created notes without resolving anything
			for (const item of featured.items as IPost[]) {
				const note = await noteService.fetchNote(item);
				assert.ok(note);
				assert.strictEqual(note.text, 'test test foo');
				assert.strictEqual(note.uri, item.id);
			}
		});

		test('Fetch featured notes from IActor pointing to another remote server', async () => {
			const actor1 = createRandomActor();
			actor1.featured = `${actor1.id}/collections/featured`;
			const actor2 = createRandomActor({ actorHost: 'https://host2.test' });

			const actor2Note = createRandomNote(actor2);
			const featured = createRandomFeaturedCollection(actor1, 0);
			(featured.items as IPost[]).push({
				...actor2Note,
				content: 'test test bar', // fraud!
			});

			resolver.register(actor1.id, actor1);
			resolver.register(actor1.featured, featured);
			resolver.register(actor2.id, actor2);
			resolver.register(actor2Note.id, actor2Note);

			await personService.createPerson(actor1.id, resolver);

			// actor2Note is from a different server and needs to be fetched again
			assert.deepStrictEqual(
				resolver.remoteGetTrials(),
				[actor1.id, actor1.featured, actor2Note.id, actor2.id],
			);

			const note = await noteService.fetchNote(actor2Note.id);
			assert.ok(note);

			// Reflects the original content instead of the fraud
			assert.strictEqual(note.text, 'test test foo');
			assert.strictEqual(note.uri, actor2Note.id);
		});

		test('Fetch a note that is a featured note of the attributed actor', async () => {
			const actor = createRandomActor();
			actor.featured = `${actor.id}/collections/featured`;

			const featured = createRandomFeaturedCollection(actor, 5);
			const firstNote = (featured.items as NonTransientIPost[])[0];

			resolver.register(actor.id, actor);
			resolver.register(actor.featured, featured);
			resolver.register(firstNote.id, firstNote);

			const note = await noteService.createNote(firstNote.id as string, undefined, resolver);
			assert.strictEqual(note?.uri, firstNote.id);
		});
	});

	describe('Images', () => {
		test('Render image document with dimensions', () => {
			const rendered = rendererService.renderDocument({
				id: genAidx(Date.now()),
				type: 'image/png',
				webpublicType: null,
				url: 'https://example.test/files/image.png',
				webpublicUrl: null,
				comment: null,
				isSensitive: false,
				properties: { width: 3600, height: 1890 },
				uri: null,
				userHost: null,
				isLink: false,
				webpublicAccessKey: null,
			} as MiDriveFile);

			assert.strictEqual(rendered.type, 'Document');
			assert.strictEqual(rendered.mediaType, 'image/png');
			assert.strictEqual(rendered.width, 3600);
			assert.strictEqual(rendered.height, 1890);
		});

		test('Create images', async () => {
			const imageObject: IApDocument = {
				type: 'Document',
				mediaType: 'image/png',
				url: 'http://host1.test/foo.png',
				name: '',
			};
			const driveFile = await imageService.createImage(
				await createRandomRemoteUser(resolver, personService),
				imageObject,
			);
			assert.ok(driveFile && !driveFile.isLink);

			const sensitiveImageObject: IApDocument = {
				type: 'Document',
				mediaType: 'image/png',
				url: 'http://host1.test/bar.png',
				name: '',
				sensitive: true,
			};
			const sensitiveDriveFile = await imageService.createImage(
				await createRandomRemoteUser(resolver, personService),
				sensitiveImageObject,
			);
			assert.ok(sensitiveDriveFile && !sensitiveDriveFile.isLink);
		});

		test('cacheRemoteFiles=false disables caching', async () => {
			updateMeta({ ...metaInitial, cacheRemoteFiles: false });

			const imageObject: IApDocument = {
				type: 'Document',
				mediaType: 'image/png',
				url: 'http://host1.test/foo.png',
				name: '',
			};
			const driveFile = await imageService.createImage(
				await createRandomRemoteUser(resolver, personService),
				imageObject,
			);
			assert.ok(driveFile && driveFile.isLink);

			const sensitiveImageObject: IApDocument = {
				type: 'Document',
				mediaType: 'image/png',
				url: 'http://host1.test/bar.png',
				name: '',
				sensitive: true,
			};
			const sensitiveDriveFile = await imageService.createImage(
				await createRandomRemoteUser(resolver, personService),
				sensitiveImageObject,
			);
			assert.ok(sensitiveDriveFile && sensitiveDriveFile.isLink);
		});

		test('cacheRemoteSensitiveFiles=false only affects sensitive files', async () => {
			updateMeta({ ...metaInitial, cacheRemoteSensitiveFiles: false });

			const imageObject: IApDocument = {
				type: 'Document',
				mediaType: 'image/png',
				url: 'http://host1.test/foo.png',
				name: '',
			};
			const driveFile = await imageService.createImage(
				await createRandomRemoteUser(resolver, personService),
				imageObject,
			);
			assert.ok(driveFile && !driveFile.isLink);

			const sensitiveImageObject: IApDocument = {
				type: 'Document',
				mediaType: 'image/png',
				url: 'http://host1.test/bar.png',
				name: '',
				sensitive: true,
			};
			const sensitiveDriveFile = await imageService.createImage(
				await createRandomRemoteUser(resolver, personService),
				sensitiveImageObject,
			);
			assert.ok(sensitiveDriveFile && sensitiveDriveFile.isLink);
		});

		test('Link is not an attachment files', async () => {
			const linkObject: IObject = {
				type: 'Link',
				href: 'https://example.com/',
			};
			const driveFile = await imageService.createImage(
				await createRandomRemoteUser(resolver, personService),
				linkObject,
			);
			assert.strictEqual(driveFile, null);
		});
	});

	describe('JSON-LD', () => {
		test('Compaction', async () => {
			const jsonLd = jsonLdService.use();

			const object = {
				'@context': [
					'https://www.w3.org/ns/activitystreams',
					{
						_misskey_quote: 'https://misskey-hub.net/ns#_misskey_quote',
						unknown: 'https://example.org/ns#unknown',
						undefined: null,
					},
				],
				id: 'https://example.com/notes/42',
				type: 'Note',
				attributedTo: 'https://example.com/users/1',
				to: ['https://www.w3.org/ns/activitystreams#Public'],
				content: 'test test foo',
				_misskey_quote: 'https://example.com/notes/1',
				unknown: 'test test bar',
				undefined: 'test test baz',
			};
			const compacted = await jsonLd.compact(object);

			assert.deepStrictEqual(compacted, {
				'@context': CONTEXT,
				id: 'https://example.com/notes/42',
				type: 'Note',
				attributedTo: 'https://example.com/users/1',
				to: 'as:Public',
				content: 'test test foo',
				_misskey_quote: 'https://example.com/notes/1',
				'https://example.org/ns#unknown': 'test test bar',
				// undefined: 'test test baz',
			});
		});
	});
});

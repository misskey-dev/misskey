import { createPublicKey } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import { In, IsNull } from 'typeorm';
import { v4 as uuid } from 'uuid';
import * as mfm from 'mfm-js';
import { DI } from '@/di-symbols.js';
import type { Config } from '@/config.js';
import type { ILocalUser, IRemoteUser, User } from '@/models/entities/User.js';
import type { IMentionedRemoteUsers, Note } from '@/models/entities/Note.js';
import type { Blocking } from '@/models/entities/Blocking.js';
import type { Relay } from '@/models/entities/Relay.js';
import type { DriveFile } from '@/models/entities/DriveFile.js';
import type { NoteReaction } from '@/models/entities/NoteReaction.js';
import type { Emoji } from '@/models/entities/Emoji.js';
import type { Poll } from '@/models/entities/Poll.js';
import type { MessagingMessage } from '@/models/entities/MessagingMessage.js';
import type { PollVote } from '@/models/entities/PollVote.js';
import { UserKeypairStoreService } from '@/core/UserKeypairStoreService.js';
import { MfmService } from '@/core/MfmService.js';
import { UserEntityService } from '@/core/entities/UserEntityService.js';
import { DriveFileEntityService } from '@/core/entities/DriveFileEntityService.js';
import type { UserKeypair } from '@/models/entities/UserKeypair.js';
import type { UsersRepository, UserProfilesRepository, NotesRepository, DriveFilesRepository, EmojisRepository, PollsRepository } from '@/models/index.js';
import { LdSignatureService } from './LdSignatureService.js';
import { ApMfmService } from './ApMfmService.js';
import type { IActivity, IObject } from './type.js';
import type { IIdentifier } from './models/identifier.js';

@Injectable()
export class ApRendererService {
	constructor(
		@Inject(DI.config)
		private config: Config,

		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		@Inject(DI.userProfilesRepository)
		private userProfilesRepository: UserProfilesRepository,

		@Inject(DI.notesRepository)
		private notesRepository: NotesRepository,

		@Inject(DI.driveFilesRepository)
		private driveFilesRepository: DriveFilesRepository,

		@Inject(DI.emojisRepository)
		private emojisRepository: EmojisRepository,

		@Inject(DI.pollsRepository)
		private pollsRepository: PollsRepository,

		private userEntityService: UserEntityService,
		private driveFileEntityService: DriveFileEntityService,
		private ldSignatureService: LdSignatureService,
		private userKeypairStoreService: UserKeypairStoreService,
		private apMfmService: ApMfmService,
		private mfmService: MfmService,
	) {
	}

	public renderAccept(object: any, user: { id: User['id']; host: null }) {
		return {
			type: 'Accept',
			actor: `${this.config.url}/users/${user.id}`,
			object,
		};
	}

	public renderAdd(user: ILocalUser, target: any, object: any) {
		return {
			type: 'Add',
			actor: `${this.config.url}/users/${user.id}`,
			target,
			object,
		};
	}

	public renderAnnounce(object: any, note: Note) {
		const attributedTo = `${this.config.url}/users/${note.userId}`;

		let to: string[] = [];
		let cc: string[] = [];

		if (note.visibility === 'public') {
			to = ['https://www.w3.org/ns/activitystreams#Public'];
			cc = [`${attributedTo}/followers`];
		} else if (note.visibility === 'home') {
			to = [`${attributedTo}/followers`];
			cc = ['https://www.w3.org/ns/activitystreams#Public'];
		} else {
			return null;
		}

		return {
			id: `${this.config.url}/notes/${note.id}/activity`,
			actor: `${this.config.url}/users/${note.userId}`,
			type: 'Announce',
			published: note.createdAt.toISOString(),
			to,
			cc,
			object,
		};
	}

	/**
	 * Renders a block into its ActivityPub representation.
	 *
	 * @param block The block to be rendered. The blockee relation must be loaded.
	 */
	public renderBlock(block: Blocking) {
		if (block.blockee?.uri == null) {
			throw new Error('renderBlock: missing blockee uri');
		}
	
		return {
			type: 'Block',
			id: `${this.config.url}/blocks/${block.id}`,
			actor: `${this.config.url}/users/${block.blockerId}`,
			object: block.blockee.uri,
		};
	}

	public renderCreate(object: any, note: Note) {
		const activity = {
			id: `${this.config.url}/notes/${note.id}/activity`,
			actor: `${this.config.url}/users/${note.userId}`,
			type: 'Create',
			published: note.createdAt.toISOString(),
			object,
		} as any;
	
		if (object.to) activity.to = object.to;
		if (object.cc) activity.cc = object.cc;
	
		return activity;
	}

	public renderDelete(object: any, user: { id: User['id']; host: null }) {
		return {
			type: 'Delete',
			actor: `${this.config.url}/users/${user.id}`,
			object,
			published: new Date().toISOString(),
		};
	}

	public renderDocument(file: DriveFile) {
		return {
			type: 'Document',
			mediaType: file.type,
			url: this.driveFileEntityService.getPublicUrl(file),
			name: file.comment,
		};
	}

	public renderEmoji(emoji: Emoji) {
		return {
			id: `${this.config.url}/emojis/${emoji.name}`,
			type: 'Emoji',
			name: `:${emoji.name}:`,
			updated: emoji.updatedAt != null ? emoji.updatedAt.toISOString() : new Date().toISOString,
			icon: {
				type: 'Image',
				mediaType: emoji.type ?? 'image/png',
				url: emoji.publicUrl ?? emoji.originalUrl, // ?? emoji.originalUrl してるのは後方互換性のため
			},
		};
	}

	// to anonymise reporters, the reporting actor must be a system user
	// object has to be a uri or array of uris
	public renderFlag(user: ILocalUser, object: [string], content: string) {
		return {
			type: 'Flag',
			actor: `${this.config.url}/users/${user.id}`,
			content,
			object,
		};
	}

	public renderFollowRelay(relay: Relay, relayActor: ILocalUser) {
		const follow = {
			id: `${this.config.url}/activities/follow-relay/${relay.id}`,
			type: 'Follow',
			actor: `${this.config.url}/users/${relayActor.id}`,
			object: 'https://www.w3.org/ns/activitystreams#Public',
		};
	
		return follow;
	}

	/**
	 * Convert (local|remote)(Follower|Followee)ID to URL
	 * @param id Follower|Followee ID
	 */
	public async renderFollowUser(id: User['id']) {
		const user = await this.usersRepository.findOneByOrFail({ id: id });
		return this.userEntityService.isLocalUser(user) ? `${this.config.url}/users/${user.id}` : user.uri;
	}

	public renderFollow(
		follower: { id: User['id']; host: User['host']; uri: User['host'] },
		followee: { id: User['id']; host: User['host']; uri: User['host'] },
		requestId?: string,
	) {
		const follow = {
			id: requestId ?? `${this.config.url}/follows/${follower.id}/${followee.id}`,
			type: 'Follow',
			actor: this.userEntityService.isLocalUser(follower) ? `${this.config.url}/users/${follower.id}` : follower.uri,
			object: this.userEntityService.isLocalUser(followee) ? `${this.config.url}/users/${followee.id}` : followee.uri,
		} as any;
	
		return follow;
	}

	public renderHashtag(tag: string) {
		return {
			type: 'Hashtag',
			href: `${this.config.url}/tags/${encodeURIComponent(tag)}`,
			name: `#${tag}`,
		};
	}

	public renderImage(file: DriveFile) {
		return {
			type: 'Image',
			url: this.driveFileEntityService.getPublicUrl(file),
			sensitive: file.isSensitive,
			name: file.comment,
		};
	}

	public renderKey(user: ILocalUser, key: UserKeypair, postfix?: string) {
		return {
			id: `${this.config.url}/users/${user.id}${postfix ?? '/publickey'}`,
			type: 'Key',
			owner: `${this.config.url}/users/${user.id}`,
			publicKeyPem: createPublicKey(key.publicKey).export({
				type: 'spki',
				format: 'pem',
			}),
		};
	}

	public async renderLike(noteReaction: NoteReaction, note: { uri: string | null }) {
		const reaction = noteReaction.reaction;

		const object = {
			type: 'Like',
			id: `${this.config.url}/likes/${noteReaction.id}`,
			actor: `${this.config.url}/users/${noteReaction.userId}`,
			object: note.uri ? note.uri : `${this.config.url}/notes/${noteReaction.noteId}`,
			content: reaction,
			_misskey_reaction: reaction,
		} as any;

		if (reaction.startsWith(':')) {
			const name = reaction.replace(/:/g, '');
			const emoji = await this.emojisRepository.findOneBy({
				name,
				host: IsNull(),
			});

			if (emoji) object.tag = [this.renderEmoji(emoji)];
		}

		return object;
	}

	public renderMention(mention: User) {
		return {
			type: 'Mention',
			href: this.userEntityService.isRemoteUser(mention) ? mention.uri : `${this.config.url}/users/${(mention as ILocalUser).id}`,
			name: this.userEntityService.isRemoteUser(mention) ? `@${mention.username}@${mention.host}` : `@${(mention as ILocalUser).username}`,
		};
	}

	public async renderNote(note: Note, dive = true, isTalk = false): Promise<IObject> {
		const getPromisedFiles = async (ids: string[]) => {
			if (!ids || ids.length === 0) return [];
			const items = await this.driveFilesRepository.findBy({ id: In(ids) });
			return ids.map(id => items.find(item => item.id === id)).filter(item => item != null) as DriveFile[];
		};
	
		let inReplyTo;
		let inReplyToNote: Note | null;
	
		if (note.replyId) {
			inReplyToNote = await this.notesRepository.findOneBy({ id: note.replyId });
	
			if (inReplyToNote != null) {
				const inReplyToUser = await this.usersRepository.findOneBy({ id: inReplyToNote.userId });
	
				if (inReplyToUser != null) {
					if (inReplyToNote.uri) {
						inReplyTo = inReplyToNote.uri;
					} else {
						if (dive) {
							inReplyTo = await this.renderNote(inReplyToNote, false);
						} else {
							inReplyTo = `${this.config.url}/notes/${inReplyToNote.id}`;
						}
					}
				}
			}
		} else {
			inReplyTo = null;
		}
	
		let quote;
	
		if (note.renoteId) {
			const renote = await this.notesRepository.findOneBy({ id: note.renoteId });
	
			if (renote) {
				quote = renote.uri ? renote.uri : `${this.config.url}/notes/${renote.id}`;
			}
		}
	
		const attributedTo = `${this.config.url}/users/${note.userId}`;
	
		const mentions = (JSON.parse(note.mentionedRemoteUsers) as IMentionedRemoteUsers).map(x => x.uri);
	
		let to: string[] = [];
		let cc: string[] = [];
	
		if (note.visibility === 'public') {
			to = ['https://www.w3.org/ns/activitystreams#Public'];
			cc = [`${attributedTo}/followers`].concat(mentions);
		} else if (note.visibility === 'home') {
			to = [`${attributedTo}/followers`];
			cc = ['https://www.w3.org/ns/activitystreams#Public'].concat(mentions);
		} else if (note.visibility === 'followers') {
			to = [`${attributedTo}/followers`];
			cc = mentions;
		} else {
			to = mentions;
		}
	
		const mentionedUsers = note.mentions.length > 0 ? await this.usersRepository.findBy({
			id: In(note.mentions),
		}) : [];
	
		const hashtagTags = (note.tags ?? []).map(tag => this.renderHashtag(tag));
		const mentionTags = mentionedUsers.map(u => this.renderMention(u));
	
		const files = await getPromisedFiles(note.fileIds);
	
		const text = note.text ?? '';
		let poll: Poll | null = null;
	
		if (note.hasPoll) {
			poll = await this.pollsRepository.findOneBy({ noteId: note.id });
		}
	
		let apText = text;
	
		if (quote) {
			apText += `\n\nRE: ${quote}`;
		}
	
		const summary = note.cw === '' ? String.fromCharCode(0x200B) : note.cw;
	
		const content = this.apMfmService.getNoteHtml(Object.assign({}, note, {
			text: apText,
		}));
	
		const emojis = await this.getEmojis(note.emojis);
		const apemojis = emojis.map(emoji => this.renderEmoji(emoji));
	
		const tag = [
			...hashtagTags,
			...mentionTags,
			...apemojis,
		];
	
		const asPoll = poll ? {
			type: 'Question',
			content: this.apMfmService.getNoteHtml(Object.assign({}, note, {
				text: text,
			})),
			[poll.expiresAt && poll.expiresAt < new Date() ? 'closed' : 'endTime']: poll.expiresAt,
			[poll.multiple ? 'anyOf' : 'oneOf']: poll.choices.map((text, i) => ({
				type: 'Note',
				name: text,
				replies: {
					type: 'Collection',
					totalItems: poll!.votes[i],
				},
			})),
		} : {};
	
		const asTalk = isTalk ? {
			_misskey_talk: true,
		} : {};
	
		return {
			id: `${this.config.url}/notes/${note.id}`,
			type: 'Note',
			attributedTo,
			summary: summary ?? undefined,
			content: content ?? undefined,
			_misskey_content: text,
			source: {
				content: text,
				mediaType: 'text/x.misskeymarkdown',
			},
			_misskey_quote: quote,
			quoteUrl: quote,
			published: note.createdAt.toISOString(),
			to,
			cc,
			inReplyTo,
			attachment: files.map(x => this.renderDocument(x)),
			sensitive: note.cw != null || files.some(file => file.isSensitive),
			tag,
			...asPoll,
			...asTalk,
		};
	}

	public async renderPerson(user: ILocalUser) {
		const id = `${this.config.url}/users/${user.id}`;
		const isSystem = !!user.username.match(/\./);

		const [avatar, banner, profile] = await Promise.all([
			user.avatarId ? this.driveFilesRepository.findOneBy({ id: user.avatarId }) : Promise.resolve(undefined),
			user.bannerId ? this.driveFilesRepository.findOneBy({ id: user.bannerId }) : Promise.resolve(undefined),
			this.userProfilesRepository.findOneByOrFail({ userId: user.id }),
		]);

		const attachment: {
			type: 'PropertyValue',
			name: string,
			value: string,
			identifier?: IIdentifier,
		}[] = [];

		if (profile.fields) {
			for (const field of profile.fields) {
				attachment.push({
					type: 'PropertyValue',
					name: field.name,
					value: (field.value != null && field.value.match(/^https?:/))
						? `<a href="${new URL(field.value).href}" rel="me nofollow noopener" target="_blank">${new URL(field.value).href}</a>`
						: field.value,
				});
			}
		}

		const emojis = await this.getEmojis(user.emojis);
		const apemojis = emojis.map(emoji => this.renderEmoji(emoji));

		const hashtagTags = (user.tags ?? []).map(tag => this.renderHashtag(tag));

		const tag = [
			...apemojis,
			...hashtagTags,
		];

		const keypair = await this.userKeypairStoreService.getUserKeypair(user.id);

		const person = {
			type: isSystem ? 'Application' : user.isBot ? 'Service' : 'Person',
			id,
			inbox: `${id}/inbox`,
			outbox: `${id}/outbox`,
			followers: `${id}/followers`,
			following: `${id}/following`,
			featured: `${id}/collections/featured`,
			sharedInbox: `${this.config.url}/inbox`,
			endpoints: { sharedInbox: `${this.config.url}/inbox` },
			url: `${this.config.url}/@${user.username}`,
			preferredUsername: user.username,
			name: user.name,
			summary: profile.description ? this.mfmService.toHtml(mfm.parse(profile.description)) : null,
			icon: avatar ? this.renderImage(avatar) : null,
			image: banner ? this.renderImage(banner) : null,
			tag,
			manuallyApprovesFollowers: user.isLocked,
			discoverable: !!user.isExplorable,
			publicKey: this.renderKey(user, keypair, '#main-key'),
			isCat: user.isCat,
			attachment: attachment.length ? attachment : undefined,
		} as any;

		if (profile.birthday) {
			person['vcard:bday'] = profile.birthday;
		}

		if (profile.location) {
			person['vcard:Address'] = profile.location;
		}

		return person;
	}

	public async renderQuestion(user: { id: User['id'] }, note: Note, poll: Poll) {
		const question = {
			type: 'Question',
			id: `${this.config.url}/questions/${note.id}`,
			actor: `${this.config.url}/users/${user.id}`,
			content: note.text ?? '',
			[poll.multiple ? 'anyOf' : 'oneOf']: poll.choices.map((text, i) => ({
				name: text,
				_misskey_votes: poll.votes[i],
				replies: {
					type: 'Collection',
					totalItems: poll.votes[i],
				},
			})),
		};
	
		return question;
	}

	public renderRead(user: { id: User['id'] }, message: MessagingMessage) {
		return {
			type: 'Read',
			actor: `${this.config.url}/users/${user.id}`,
			object: message.uri,
		};
	}

	public renderReject(object: any, user: { id: User['id'] }) {
		return {
			type: 'Reject',
			actor: `${this.config.url}/users/${user.id}`,
			object,
		};
	}

	public renderRemove(user: { id: User['id'] }, target: any, object: any) {
		return {
			type: 'Remove',
			actor: `${this.config.url}/users/${user.id}`,
			target,
			object,
		};
	}

	public renderTombstone(id: string) {
		return {
			id,
			type: 'Tombstone',
		};
	}

	public renderUndo(object: any, user: { id: User['id'] }) {
		if (object == null) return null;
		const id = typeof object.id === 'string' && object.id.startsWith(this.config.url) ? `${object.id}/undo` : undefined;

		return {
			type: 'Undo',
			...(id ? { id } : {}),
			actor: `${this.config.url}/users/${user.id}`,
			object,
			published: new Date().toISOString(),
		};
	}

	public renderUpdate(object: any, user: { id: User['id'] }) {
		const activity = {
			id: `${this.config.url}/users/${user.id}#updates/${new Date().getTime()}`,
			actor: `${this.config.url}/users/${user.id}`,
			type: 'Update',
			to: ['https://www.w3.org/ns/activitystreams#Public'],
			object,
			published: new Date().toISOString(),
		} as any;
	
		return activity;
	}

	public renderVote(user: { id: User['id'] }, vote: PollVote, note: Note, poll: Poll, pollOwner: IRemoteUser) {
		return {
			id: `${this.config.url}/users/${user.id}#votes/${vote.id}/activity`,
			actor: `${this.config.url}/users/${user.id}`,
			type: 'Create',
			to: [pollOwner.uri],
			published: new Date().toISOString(),
			object: {
				id: `${this.config.url}/users/${user.id}#votes/${vote.id}`,
				type: 'Note',
				attributedTo: `${this.config.url}/users/${user.id}`,
				to: [pollOwner.uri],
				inReplyTo: note.uri,
				name: poll.choices[vote.choice],
			},
		};
	}

	public renderActivity(x: any): IActivity | null {
		if (x == null) return null;
	
		if (typeof x === 'object' && x.id == null) {
			x.id = `${this.config.url}/${uuid()}`;
		}
	
		return Object.assign({
			'@context': [
				'https://www.w3.org/ns/activitystreams',
				'https://w3id.org/security/v1',
				{
					// as non-standards
					manuallyApprovesFollowers: 'as:manuallyApprovesFollowers',
					sensitive: 'as:sensitive',
					Hashtag: 'as:Hashtag',
					quoteUrl: 'as:quoteUrl',
					// Mastodon
					toot: 'http://joinmastodon.org/ns#',
					Emoji: 'toot:Emoji',
					featured: 'toot:featured',
					discoverable: 'toot:discoverable',
					// schema
					schema: 'http://schema.org#',
					PropertyValue: 'schema:PropertyValue',
					value: 'schema:value',
					// Misskey
					misskey: 'https://misskey-hub.net/ns#',
					'_misskey_content': 'misskey:_misskey_content',
					'_misskey_quote': 'misskey:_misskey_quote',
					'_misskey_reaction': 'misskey:_misskey_reaction',
					'_misskey_votes': 'misskey:_misskey_votes',
					'_misskey_talk': 'misskey:_misskey_talk',
					'isCat': 'misskey:isCat',
					// vcard
					vcard: 'http://www.w3.org/2006/vcard/ns#',
				},
			],
		}, x);
	}
	
	public async attachLdSignature(activity: any, user: { id: User['id']; host: null; }): Promise<IActivity> {
		const keypair = await this.userKeypairStoreService.getUserKeypair(user.id);
	
		const ldSignature = this.ldSignatureService.use();
		ldSignature.debug = false;
		activity = await ldSignature.signRsaSignature2017(activity, keypair.privateKey, `${this.config.url}/users/${user.id}#main-key`);
	
		return activity;
	}
	
	/**
	 * Render OrderedCollectionPage
	 * @param id URL of self
	 * @param totalItems Number of total items
	 * @param orderedItems Items
	 * @param partOf URL of base
	 * @param prev URL of prev page (optional)
	 * @param next URL of next page (optional)
	 */
	public renderOrderedCollectionPage(id: string, totalItems: any, orderedItems: any, partOf: string, prev?: string, next?: string) {
		const page = {
			id,
			partOf,
			type: 'OrderedCollectionPage',
			totalItems,
			orderedItems,
		} as any;

		if (prev) page.prev = prev;
		if (next) page.next = next;

		return page;
	}

	/**
	 * Render OrderedCollection
	 * @param id URL of self
	 * @param totalItems Total number of items
	 * @param first URL of first page (optional)
	 * @param last URL of last page (optional)
	 * @param orderedItems attached objects (optional)
	 */
	public renderOrderedCollection(id: string | null, totalItems: any, first?: string, last?: string, orderedItems?: Record<string, unknown>[]) {
		const page: any = {
			id,
			type: 'OrderedCollection',
			totalItems,
		};
	
		if (first) page.first = first;
		if (last) page.last = last;
		if (orderedItems) page.orderedItems = orderedItems;
	
		return page;
	}

	private async getEmojis(names: string[]): Promise<Emoji[]> {
		if (names == null || names.length === 0) return [];

		const emojis = await Promise.all(
			names.map(name => this.emojisRepository.findOneBy({
				name,
				host: IsNull(),
			})),
		);

		return emojis.filter(emoji => emoji != null) as Emoji[];
	}
}

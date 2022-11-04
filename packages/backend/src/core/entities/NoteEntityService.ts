import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { DataSource, In } from 'typeorm';
import * as mfm from 'mfm-js';
import { ModuleRef } from '@nestjs/core';
import { DI } from '@/di-symbols.js';
import type { Config } from '@/config.js';
import type { Packed } from '@/misc/schema.js';
import { nyaize } from '@/misc/nyaize.js';
import { awaitAll } from '@/misc/prelude/await-all.js';
import type { User } from '@/models/entities/User.js';
import type { Note } from '@/models/entities/Note.js';
import type { NoteReaction } from '@/models/entities/NoteReaction.js';
import type { UsersRepository, NotesRepository, FollowingsRepository, PollsRepository, PollVotesRepository, NoteReactionsRepository, ChannelsRepository, DriveFilesRepository } from '@/models/index.js';
import type { OnModuleInit } from '@nestjs/common';
import type { CustomEmojiService } from '../CustomEmojiService.js';
import type { ReactionService } from '../ReactionService.js';
import type { UserEntityService } from './UserEntityService.js';
import type { DriveFileEntityService } from './DriveFileEntityService.js';

@Injectable()
export class NoteEntityService implements OnModuleInit {
	private userEntityService: UserEntityService;
	private driveFileEntityService: DriveFileEntityService;
	private customEmojiService: CustomEmojiService;
	private reactionService: ReactionService;
	
	constructor(
		private moduleRef: ModuleRef,

		@Inject(DI.db)
		private db: DataSource,

		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		@Inject(DI.notesRepository)
		private notesRepository: NotesRepository,

		@Inject(DI.followingsRepository)
		private followingsRepository: FollowingsRepository,

		@Inject(DI.pollsRepository)
		private pollsRepository: PollsRepository,

		@Inject(DI.pollVotesRepository)
		private pollVotesRepository: PollVotesRepository,

		@Inject(DI.noteReactionsRepository)
		private noteReactionsRepository: NoteReactionsRepository,

		@Inject(DI.channelsRepository)
		private channelsRepository: ChannelsRepository,

		@Inject(DI.driveFilesRepository)
		private driveFilesRepository: DriveFilesRepository,

		//private userEntityService: UserEntityService,
		//private driveFileEntityService: DriveFileEntityService,
		//private customEmojiService: CustomEmojiService,
		//private reactionService: ReactionService,
	) {
	}

	onModuleInit() {
		this.userEntityService = this.moduleRef.get('UserEntityService');
		this.driveFileEntityService = this.moduleRef.get('DriveFileEntityService');
		this.customEmojiService = this.moduleRef.get('CustomEmojiService');
		this.reactionService = this.moduleRef.get('ReactionService');
	}
	
	private async hideNote(packedNote: Packed<'Note'>, meId: User['id'] | null) {
	// TODO: isVisibleForMe を使うようにしても良さそう(型違うけど)
		let hide = false;

		// visibility が specified かつ自分が指定されていなかったら非表示
		if (packedNote.visibility === 'specified') {
			if (meId == null) {
				hide = true;
			} else if (meId === packedNote.userId) {
				hide = false;
			} else {
			// 指定されているかどうか
				const specified = packedNote.visibleUserIds!.some((id: any) => meId === id);

				if (specified) {
					hide = false;
				} else {
					hide = true;
				}
			}
		}

		// visibility が followers かつ自分が投稿者のフォロワーでなかったら非表示
		if (packedNote.visibility === 'followers') {
			if (meId == null) {
				hide = true;
			} else if (meId === packedNote.userId) {
				hide = false;
			} else if (packedNote.reply && (meId === packedNote.reply.userId)) {
			// 自分の投稿に対するリプライ
				hide = false;
			} else if (packedNote.mentions && packedNote.mentions.some(id => meId === id)) {
			// 自分へのメンション
				hide = false;
			} else {
			// フォロワーかどうか
				const following = await this.followingsRepository.findOneBy({
					followeeId: packedNote.userId,
					followerId: meId,
				});

				if (following == null) {
					hide = true;
				} else {
					hide = false;
				}
			}
		}

		if (hide) {
			packedNote.visibleUserIds = undefined;
			packedNote.fileIds = [];
			packedNote.files = [];
			packedNote.text = null;
			packedNote.poll = undefined;
			packedNote.cw = null;
			packedNote.isHidden = true;
		}
	}

	private async populatePoll(note: Note, meId: User['id'] | null) {
		const poll = await this.pollsRepository.findOneByOrFail({ noteId: note.id });
		const choices = poll.choices.map(c => ({
			text: c,
			votes: poll.votes[poll.choices.indexOf(c)],
			isVoted: false,
		}));

		if (meId) {
			if (poll.multiple) {
				const votes = await this.pollVotesRepository.findBy({
					userId: meId,
					noteId: note.id,
				});

				const myChoices = votes.map(v => v.choice);
				for (const myChoice of myChoices) {
					choices[myChoice].isVoted = true;
				}
			} else {
				const vote = await this.pollVotesRepository.findOneBy({
					userId: meId,
					noteId: note.id,
				});

				if (vote) {
					choices[vote.choice].isVoted = true;
				}
			}
		}

		return {
			multiple: poll.multiple,
			expiresAt: poll.expiresAt,
			choices,
		};
	}

	private async populateMyReaction(note: Note, meId: User['id'], _hint_?: {
		myReactions: Map<Note['id'], NoteReaction | null>;
	}) {
		if (_hint_?.myReactions) {
			const reaction = _hint_.myReactions.get(note.id);
			if (reaction) {
				return this.reactionService.convertLegacyReaction(reaction.reaction);
			} else if (reaction === null) {
				return undefined;
			}
		// 実装上抜けがあるだけかもしれないので、「ヒントに含まれてなかったら(=undefinedなら)return」のようにはしない
		}

		const reaction = await this.noteReactionsRepository.findOneBy({
			userId: meId,
			noteId: note.id,
		});

		if (reaction) {
			return this.reactionService.convertLegacyReaction(reaction.reaction);
		}

		return undefined;
	}

	public async isVisibleForMe(note: Note, meId: User['id'] | null): Promise<boolean> {
		// This code must always be synchronized with the checks in generateVisibilityQuery.
		// visibility が specified かつ自分が指定されていなかったら非表示
		if (note.visibility === 'specified') {
			if (meId == null) {
				return false;
			} else if (meId === note.userId) {
				return true;
			} else {
				// 指定されているかどうか
				return note.visibleUserIds.some((id: any) => meId === id);
			}
		}

		// visibility が followers かつ自分が投稿者のフォロワーでなかったら非表示
		if (note.visibility === 'followers') {
			if (meId == null) {
				return false;
			} else if (meId === note.userId) {
				return true;
			} else if (note.reply && (meId === note.reply.userId)) {
				// 自分の投稿に対するリプライ
				return true;
			} else if (note.mentions && note.mentions.some(id => meId === id)) {
				// 自分へのメンション
				return true;
			} else {
				// フォロワーかどうか
				const [following, user] = await Promise.all([
					this.followingsRepository.count({
						where: {
							followeeId: note.userId,
							followerId: meId,
						},
						take: 1,
					}),
					this.usersRepository.findOneByOrFail({ id: meId }),
				]);

				/* If we know the following, everyhting is fine.

				But if we do not know the following, it might be that both the
				author of the note and the author of the like are remote users,
				in which case we can never know the following. Instead we have
				to assume that the users are following each other.
				*/
				return following > 0 || (note.userHost != null && user.host != null);
			}
		}

		return true;
	}

	public async pack(
		src: Note['id'] | Note,
		me?: { id: User['id'] } | null | undefined,
		options?: {
			detail?: boolean;
			skipHide?: boolean;
			_hint_?: {
				myReactions: Map<Note['id'], NoteReaction | null>;
			};
		},
	): Promise<Packed<'Note'>> {
		const opts = Object.assign({
			detail: true,
			skipHide: false,
		}, options);

		const meId = me ? me.id : null;
		const note = typeof src === 'object' ? src : await this.notesRepository.findOneByOrFail({ id: src });
		const host = note.userHost;

		let text = note.text;

		if (note.name && (note.url ?? note.uri)) {
			text = `【${note.name}】\n${(note.text ?? '').trim()}\n\n${note.url ?? note.uri}`;
		}

		const channel = note.channelId
			? note.channel
				? note.channel
				: await this.channelsRepository.findOneBy({ id: note.channelId })
			: null;

		const reactionEmojiNames = Object.keys(note.reactions).filter(x => x.startsWith(':')).map(x => this.reactionService.decodeReaction(x).reaction).map(x => x.replace(/:/g, ''));

		const packed: Packed<'Note'> = await awaitAll({
			id: note.id,
			createdAt: note.createdAt.toISOString(),
			userId: note.userId,
			user: this.userEntityService.pack(note.user ?? note.userId, me, {
				detail: false,
			}),
			text: text,
			cw: note.cw,
			visibility: note.visibility,
			localOnly: note.localOnly ?? undefined,
			visibleUserIds: note.visibility === 'specified' ? note.visibleUserIds : undefined,
			renoteCount: note.renoteCount,
			repliesCount: note.repliesCount,
			reactions: this.reactionService.convertLegacyReactions(note.reactions),
			tags: note.tags.length > 0 ? note.tags : undefined,
			emojis: this.customEmojiService.populateEmojis(note.emojis.concat(reactionEmojiNames), host),
			fileIds: note.fileIds,
			files: this.driveFileEntityService.packMany(note.fileIds),
			replyId: note.replyId,
			renoteId: note.renoteId,
			channelId: note.channelId ?? undefined,
			channel: channel ? {
				id: channel.id,
				name: channel.name,
			} : undefined,
			mentions: note.mentions.length > 0 ? note.mentions : undefined,
			uri: note.uri ?? undefined,
			url: note.url ?? undefined,

			...(opts.detail ? {
				reply: note.replyId ? this.pack(note.reply ?? note.replyId, me, {
					detail: false,
					_hint_: options?._hint_,
				}) : undefined,

				renote: note.renoteId ? this.pack(note.renote ?? note.renoteId, me, {
					detail: true,
					_hint_: options?._hint_,
				}) : undefined,

				poll: note.hasPoll ? this.populatePoll(note, meId) : undefined,

				...(meId ? {
					myReaction: this.populateMyReaction(note, meId, options?._hint_),
				} : {}),
			} : {}),
		});

		if (packed.user.isCat && packed.text) {
			const tokens = packed.text ? mfm.parse(packed.text) : [];
			mfm.inspect(tokens, node => {
				if (node.type === 'text') {
					// TODO: quoteなtextはskip
					node.props.text = nyaize(node.props.text);
				}
			});
			packed.text = mfm.toString(tokens);
		}

		if (!opts.skipHide) {
			await this.hideNote(packed, meId);
		}

		return packed;
	}

	public async packMany(
		notes: Note[],
		me?: { id: User['id'] } | null | undefined,
		options?: {
			detail?: boolean;
			skipHide?: boolean;
		},
	) {
		if (notes.length === 0) return [];

		const meId = me ? me.id : null;
		const myReactionsMap = new Map<Note['id'], NoteReaction | null>();
		if (meId) {
			const renoteIds = notes.filter(n => n.renoteId != null).map(n => n.renoteId!);
			const targets = [...notes.map(n => n.id), ...renoteIds];
			const myReactions = await this.noteReactionsRepository.findBy({
				userId: meId,
				noteId: In(targets),
			});

			for (const target of targets) {
				myReactionsMap.set(target, myReactions.find(reaction => reaction.noteId === target) ?? null);
			}
		}

		await this.customEmojiService.prefetchEmojis(this.customEmojiService.aggregateNoteEmojis(notes));

		return await Promise.all(notes.map(n => this.pack(n, me, {
			...options,
			_hint_: {
				myReactions: myReactionsMap,
			},
		})));
	}

	public async countSameRenotes(userId: string, renoteId: string, excludeNoteId: string | undefined): Promise<number> {
		// 指定したユーザーの指定したノートのリノートがいくつあるか数える
		const query = this.notesRepository.createQueryBuilder('note')
			.where('note.userId = :userId', { userId })
			.andWhere('note.renoteId = :renoteId', { renoteId });
	
		// 指定した投稿を除く
		if (excludeNoteId) {
			query.andWhere('note.id != :excludeNoteId', { excludeNoteId });
		}
	
		return await query.getCount();
	}	
}

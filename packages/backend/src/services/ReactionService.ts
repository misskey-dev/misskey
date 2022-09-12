import { Inject, Injectable } from '@nestjs/common';
import { IsNull } from 'typeorm';
import { DI_SYMBOLS } from '@/di-symbols.js';
import type { Blockings, Emojis, NoteReactions , Users , Notes } from '@/models/index.js';

import { IdentifiableError } from '@/misc/identifiable-error.js';
import type { IRemoteUser, User } from '@/models/entities/user.js';
import type { Note } from '@/models/entities/note.js';
import { genId } from '@/misc/gen-id.js';
import type { NoteReaction } from '@/models/entities/note-reaction.js';
import { isDuplicateKeyValueError } from '@/misc/is-duplicate-key-value-error.js';
import type { GlobalEventService } from '@/services/GlobalEventService.js';
import type { CreateNotificationService } from '@/services/CreateNotificationService.js';
import DeliverManager from '@/services/remote/activitypub/deliver-manager.js';
import type PerUserReactionsChart from '@/services/chart/charts/per-user-reactions.js';
import { toDbReaction } from '@/misc/reaction-lib.js';

@Injectable()
export class ReactionService {
	constructor(
		@Inject('usersRepository')
		private usersRepository: typeof Users,

		@Inject('blockingsRepository')
		private blockingsRepository: typeof Blockings,

		@Inject('notesRepository')
		private notesRepository: typeof Notes,

		@Inject('noteReactionsRepository')
		private noteReactionsRepository: typeof NoteReactions,

		@Inject('emojisRepository')
		private emojisRepository: typeof Emojis,

		private globalEventServie: GlobalEventService,
		private createNotificationService: CreateNotificationService,
		private perUserReactionsChart: PerUserReactionsChart,
	) {
	}

	public async create(user: { id: User['id']; host: User['host']; }, note: Note, reaction?: string) {
		// Check blocking
		if (note.userId !== user.id) {
			const block = await this.blockingsRepository.findOneBy({
				blockerId: note.userId,
				blockeeId: user.id,
			});
			if (block) {
				throw new IdentifiableError('e70412a4-7197-4726-8e74-f3e0deb92aa7');
			}
		}
	
		// check visibility
		if (!await this.notesRepository.isVisibleForMe(note, user.id)) {
			throw new IdentifiableError('68e9d2d1-48bf-42c2-b90a-b20e09fd3d48', 'Note not accessible for you.');
		}
	
		// TODO: cache
		reaction = await toDbReaction(reaction, user.host);
	
		const record: NoteReaction = {
			id: genId(),
			createdAt: new Date(),
			noteId: note.id,
			userId: user.id,
			reaction,
		};
	
		// Create reaction
		try {
			await this.noteReactionsRepository.insert(record);
		} catch (e) {
			if (isDuplicateKeyValueError(e)) {
				const exists = await this.noteReactionsRepository.findOneByOrFail({
					noteId: note.id,
					userId: user.id,
				});
	
				if (exists.reaction !== reaction) {
					// 別のリアクションがすでにされていたら置き換える
					await deleteReaction(user, note);
					await this.noteReactionsRepository.insert(record);
				} else {
					// 同じリアクションがすでにされていたらエラー
					throw new IdentifiableError('51c42bb4-931a-456b-bff7-e5a8a70dd298');
				}
			} else {
				throw e;
			}
		}
	
		// Increment reactions count
		const sql = `jsonb_set("reactions", '{${reaction}}', (COALESCE("reactions"->>'${reaction}', '0')::int + 1)::text::jsonb)`;
		await this.notesRepository.createQueryBuilder().update()
			.set({
				reactions: () => sql,
				score: () => '"score" + 1',
			})
			.where('id = :id', { id: note.id })
			.execute();
	
		this.perUserReactionsChart.update(user, note);
	
		// カスタム絵文字リアクションだったら絵文字情報も送る
		const decodedReaction = decodeReaction(reaction);
	
		const emoji = await this.emojisRepository.findOne({
			where: {
				name: decodedReaction.name,
				host: decodedReaction.host ?? IsNull(),
			},
			select: ['name', 'host', 'originalUrl', 'publicUrl'],
		});
	
		this.globalEventServie.publishNoteStream(note.id, 'reacted', {
			reaction: decodedReaction.reaction,
			emoji: emoji != null ? {
				name: emoji.host ? `${emoji.name}@${emoji.host}` : `${emoji.name}@.`,
				url: emoji.publicUrl || emoji.originalUrl, // || emoji.originalUrl してるのは後方互換性のため
			} : null,
			userId: user.id,
		});
	
		// リアクションされたユーザーがローカルユーザーなら通知を作成
		if (note.userHost === null) {
			this.createNotificationService.createNotification(note.userId, 'reaction', {
				notifierId: user.id,
				noteId: note.id,
				reaction: reaction,
			});
		}
	
		//#region 配信
		if (this.usersRepository.isLocalUser(user) && !note.localOnly) {
			const content = renderActivity(await renderLike(record, note));
			const dm = new DeliverManager(user, content);
			if (note.userHost !== null) {
				const reactee = await this.usersRepository.findOneBy({ id: note.userId });
				dm.addDirectRecipe(reactee as IRemoteUser);
			}
	
			if (['public', 'home', 'followers'].includes(note.visibility)) {
				dm.addFollowersRecipe();
			} else if (note.visibility === 'specified') {
				const visibleUsers = await Promise.all(note.visibleUserIds.map(id => this.usersRepository.findOneBy({ id })));
				for (const u of visibleUsers.filter(u => u && this.usersRepository.isRemoteUser(u))) {
					dm.addDirectRecipe(u as IRemoteUser);
				}
			}
	
			dm.execute();
		}
		//#endregion
	}

	public async delete(user: { id: User['id']; host: User['host']; }, note: Note) {
		// if already unreacted
		const exist = await this.noteReactionsRepository.findOneBy({
			noteId: note.id,
			userId: user.id,
		});
	
		if (exist == null) {
			throw new IdentifiableError('60527ec9-b4cb-4a88-a6bd-32d3ad26817d', 'not reacted');
		}
	
		// Delete reaction
		const result = await this.noteReactionsRepository.delete(exist.id);
	
		if (result.affected !== 1) {
			throw new IdentifiableError('60527ec9-b4cb-4a88-a6bd-32d3ad26817d', 'not reacted');
		}
	
		// Decrement reactions count
		const sql = `jsonb_set("reactions", '{${exist.reaction}}', (COALESCE("reactions"->>'${exist.reaction}', '0')::int - 1)::text::jsonb)`;
		await this.notesRepository.createQueryBuilder().update()
			.set({
				reactions: () => sql,
			})
			.where('id = :id', { id: note.id })
			.execute();
	
		this.notesRepository.decrement({ id: note.id }, 'score', 1);
	
		this.globalEventServie.publishNoteStream(note.id, 'unreacted', {
			reaction: decodeReaction(exist.reaction).reaction,
			userId: user.id,
		});
	
		//#region 配信
		if (this.usersRepository.isLocalUser(user) && !note.localOnly) {
			const content = renderActivity(renderUndo(await renderLike(exist, note), user));
			const dm = new DeliverManager(user, content);
			if (note.userHost !== null) {
				const reactee = await this.usersRepository.findOneBy({ id: note.userId });
				dm.addDirectRecipe(reactee as IRemoteUser);
			}
			dm.addFollowersRecipe();
			dm.execute();
		}
		//#endregion
	}
}

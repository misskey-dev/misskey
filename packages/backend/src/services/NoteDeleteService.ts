import { Brackets, In } from 'typeorm';
import { Injectable, Inject } from '@nestjs/common';
import renderDelete from '@/services/remote/activitypub/renderer/delete.js';
import renderAnnounce from '@/services/remote/activitypub/renderer/announce.js';
import renderUndo from '@/services/remote/activitypub/renderer/undo.js';
import { renderActivity } from '@/services/remote/activitypub/renderer/index.js';
import renderTombstone from '@/services/remote/activitypub/renderer/tombstone.js';
import type { User, ILocalUser, IRemoteUser } from '@/models/entities/user.js';
import type { Note, IMentionedRemoteUsers } from '@/models/entities/note.js';
import type { Notes } from '@/models/index.js';
import { Users, Instances } from '@/models/index.js';
import { deliverToFollowers, deliverToUser } from '@/services/remote/activitypub/deliver-manager.js';
import { countSameRenotes } from '@/misc/count-same-renotes.js';
import type { RelayService } from '@/services/RelayService.js';
import type { FederatedInstanceService } from '@/services/FederatedInstanceService.js';
import { DI_SYMBOLS } from '@/di-symbols.js';
import type { Config } from '@/config/types.js';
import type NotesChart from '@/services/chart/charts/notes.js';
import type PerUserNotesChart from '@/services/chart/charts/per-user-notes.js';
import type InstanceChart from '@/services/chart/charts/instance.js';
import type { GlobalEventService } from '@/services/GlobalEventService.js';

@Injectable()
export class NoteCreateService {
	constructor(
		@Inject(DI_SYMBOLS.config)
		private config: Config,

		@Inject('notesRepository')
		private notesRepository: typeof Notes,

		private globalEventServie: GlobalEventService,
		private relayService: RelayService,
		private federatedInstanceService: FederatedInstanceService,
		private notesChart: NotesChart,
		private perUserNotesChart: PerUserNotesChart,
		private instanceChart: InstanceChart,
	) {}
	
	/**
 * 投稿を削除します。
 * @param user 投稿者
 * @param note 投稿
 */
	async delete(user: { id: User['id']; uri: User['uri']; host: User['host']; }, note: Note, quiet = false) {
		const deletedAt = new Date();

		// この投稿を除く指定したユーザーによる指定したノートのリノートが存在しないとき
		if (note.renoteId && (await countSameRenotes(user.id, note.renoteId, note.id)) === 0) {
			this.notesRepository.decrement({ id: note.renoteId }, 'renoteCount', 1);
			this.notesRepository.decrement({ id: note.renoteId }, 'score', 1);
		}

		if (note.replyId) {
			await this.notesRepository.decrement({ id: note.replyId }, 'repliesCount', 1);
		}

		if (!quiet) {
			this.globalEventServie.publishNoteStream(note.id, 'deleted', {
				deletedAt: deletedAt,
			});

			//#region ローカルの投稿なら削除アクティビティを配送
			if (Users.isLocalUser(user) && !note.localOnly) {
				let renote: Note | null = null;

				// if deletd note is renote
				if (note.renoteId && note.text == null && !note.hasPoll && (note.fileIds == null || note.fileIds.length === 0)) {
					renote = await this.notesRepository.findOneBy({
						id: note.renoteId,
					});
				}

				const content = renderActivity(renote
					? renderUndo(renderAnnounce(renote.uri || `${this.config.url}/notes/${renote.id}`, note), user)
					: renderDelete(renderTombstone(`${this.config.url}/notes/${note.id}`), user));

				this.#deliverToConcerned(user, note, content);
			}

			// also deliever delete activity to cascaded notes
			const cascadingNotes = (await this.#findCascadingNotes(note)).filter(note => !note.localOnly); // filter out local-only notes
			for (const cascadingNote of cascadingNotes) {
				if (!cascadingNote.user) continue;
				if (!Users.isLocalUser(cascadingNote.user)) continue;
				const content = renderActivity(renderDelete(renderTombstone(`${this.config.url}/notes/${cascadingNote.id}`), cascadingNote.user));
				this.#deliverToConcerned(cascadingNote.user, cascadingNote, content);
			}
			//#endregion

			// 統計を更新
			this.notesChart.update(note, false);
			this.perUserNotesChart.update(user, note, false);

			if (Users.isRemoteUser(user)) {
				this.federatedInstanceService.registerOrFetchInstanceDoc(user.host).then(i => {
					Instances.decrement({ id: i.id }, 'notesCount', 1);
					this.instanceChart.updateNote(i.host, note, false);
				});
			}
		}

		await this.notesRepository.delete({
			id: note.id,
			userId: user.id,
		});
	}

	async #findCascadingNotes(note: Note) {
		const cascadingNotes: Note[] = [];

		const recursive = async (noteId: string) => {
			const query = this.notesRepository.createQueryBuilder('note')
				.where('note.replyId = :noteId', { noteId })
				.orWhere(new Brackets(q => {
					q.where('note.renoteId = :noteId', { noteId })
						.andWhere('note.text IS NOT NULL');
				}))
				.leftJoinAndSelect('note.user', 'user');
			const replies = await query.getMany();
			for (const reply of replies) {
				cascadingNotes.push(reply);
				await recursive(reply.id);
			}
		};
		await recursive(note.id);

		return cascadingNotes.filter(note => note.userHost === null); // filter out non-local users
	}

	async #getMentionedRemoteUsers(note: Note) {
		const where = [] as any[];

		// mention / reply / dm
		const uris = (JSON.parse(note.mentionedRemoteUsers) as IMentionedRemoteUsers).map(x => x.uri);
		if (uris.length > 0) {
			where.push(
				{ uri: In(uris) },
			);
		}

		// renote / quote
		if (note.renoteUserId) {
			where.push({
				id: note.renoteUserId,
			});
		}

		if (where.length === 0) return [];

		return await Users.find({
			where,
		}) as IRemoteUser[];
	}

	async #deliverToConcerned(user: { id: ILocalUser['id']; host: null; }, note: Note, content: any) {
		deliverToFollowers(user, content);
		this.relayService.deliverToRelays(user, content);
		const remoteUsers = await this.#getMentionedRemoteUsers(note);
		for (const remoteUser of remoteUsers) {
			deliverToUser(user, content, remoteUser);
		}
	}
}

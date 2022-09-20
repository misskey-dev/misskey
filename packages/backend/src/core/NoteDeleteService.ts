import { Brackets, In } from 'typeorm';
import { Injectable, Inject } from '@nestjs/common';
import type { User, ILocalUser, IRemoteUser } from '@/models/entities/User.js';
import type { Note, IMentionedRemoteUsers } from '@/models/entities/Note.js';
import type { InstancesRepository, NotesRepository, UsersRepository } from '@/models/index.js';
import { RelayService } from '@/core/RelayService.js';
import { FederatedInstanceService } from '@/core/FederatedInstanceService.js';
import { DI } from '@/di-symbols.js';
import type { Config } from '@/config.js';
import NotesChart from '@/core/chart/charts/notes.js';
import PerUserNotesChart from '@/core/chart/charts/per-user-notes.js';
import InstanceChart from '@/core/chart/charts/instance.js';
import { GlobalEventService } from '@/core/GlobalEventService.js';
import { ApRendererService } from './remote/activitypub/ApRendererService.js';
import { ApDeliverManagerService } from './remote/activitypub/ApDeliverManagerService.js';
import { UserEntityService } from './entities/UserEntityService.js';
import { NoteEntityService } from './entities/NoteEntityService.js';

@Injectable()
export class NoteDeleteService {
	constructor(
		@Inject(DI.config)
		private config: Config,

		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		@Inject(DI.notesRepository)
		private notesRepository: NotesRepository,

		@Inject(DI.instancesRepository)
		private instancesRepository: InstancesRepository,

		private userEntityService: UserEntityService,
		private noteEntityService: NoteEntityService,
		private globalEventServie: GlobalEventService,
		private relayService: RelayService,
		private federatedInstanceService: FederatedInstanceService,
		private apRendererService: ApRendererService,
		private apDeliverManagerService: ApDeliverManagerService,
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
		if (note.renoteId && (await this.noteEntityService.countSameRenotes(user.id, note.renoteId, note.id)) === 0) {
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
			if (this.userEntityService.isLocalUser(user) && !note.localOnly) {
				let renote: Note | null = null;

				// if deletd note is renote
				if (note.renoteId && note.text == null && !note.hasPoll && (note.fileIds == null || note.fileIds.length === 0)) {
					renote = await this.notesRepository.findOneBy({
						id: note.renoteId,
					});
				}

				const content = this.apRendererService.renderActivity(renote
					? this.apRendererService.renderUndo(this.apRendererService.renderAnnounce(renote.uri ?? `${this.config.url}/notes/${renote.id}`, note), user)
					: this.apRendererService.renderDelete(this.apRendererService.renderTombstone(`${this.config.url}/notes/${note.id}`), user));

				this.deliverToConcerned(user, note, content);
			}

			// also deliever delete activity to cascaded notes
			const cascadingNotes = (await this.findCascadingNotes(note)).filter(note => !note.localOnly); // filter out local-only notes
			for (const cascadingNote of cascadingNotes) {
				if (!cascadingNote.user) continue;
				if (!this.userEntityService.isLocalUser(cascadingNote.user)) continue;
				const content = this.apRendererService.renderActivity(this.apRendererService.renderDelete(this.apRendererService.renderTombstone(`${this.config.url}/notes/${cascadingNote.id}`), cascadingNote.user));
				this.deliverToConcerned(cascadingNote.user, cascadingNote, content);
			}
			//#endregion

			// 統計を更新
			this.notesChart.update(note, false);
			this.perUserNotesChart.update(user, note, false);

			if (this.userEntityService.isRemoteUser(user)) {
				this.federatedInstanceService.registerOrFetchInstanceDoc(user.host).then(i => {
					this.instancesRepository.decrement({ id: i.id }, 'notesCount', 1);
					this.instanceChart.updateNote(i.host, note, false);
				});
			}
		}

		await this.notesRepository.delete({
			id: note.id,
			userId: user.id,
		});
	}

	private async findCascadingNotes(note: Note) {
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

	private async getMentionedRemoteUsers(note: Note) {
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

		return await this.usersRepository.find({
			where,
		}) as IRemoteUser[];
	}

	private async deliverToConcerned(user: { id: ILocalUser['id']; host: null; }, note: Note, content: any) {
		this.apDeliverManagerService.deliverToFollowers(user, content);
		this.relayService.deliverToRelays(user, content);
		const remoteUsers = await this.getMentionedRemoteUsers(note);
		for (const remoteUser of remoteUsers) {
			this.apDeliverManagerService.deliverToUser(user, content, remoteUser);
		}
	}
}

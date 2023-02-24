import { Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import type { Antenna } from '@/models/entities/Antenna.js';
import type { Note } from '@/models/entities/Note.js';
import type { User } from '@/models/entities/User.js';
import { NoteEntityService } from '@/core/entities/NoteEntityService.js';
import { AntennaEntityService } from '@/core/entities/AntennaEntityService.js';
import { IdService } from '@/core/IdService.js';
import { isUserRelated } from '@/misc/is-user-related.js';
import { GlobalEventService } from '@/core/GlobalEventService.js';
import { PushNotificationService } from '@/core/PushNotificationService.js';
import * as Acct from '@/misc/acct.js';
import type { Packed } from '@/misc/schema.js';
import { DI } from '@/di-symbols.js';
import type { MutingsRepository, NotesRepository, AntennaNotesRepository, AntennasRepository, UserListJoiningsRepository } from '@/models/index.js';
import { UtilityService } from '@/core/UtilityService.js';
import { bindThis } from '@/decorators.js';
import { StreamMessages } from '@/server/api/stream/types.js';
import type { OnApplicationShutdown } from '@nestjs/common';

@Injectable()
export class AntennaService implements OnApplicationShutdown {
	private antennasFetched: boolean;
	private antennas: Antenna[];

	constructor(
		@Inject(DI.redisSubscriber)
		private redisSubscriber: Redis.Redis,

		@Inject(DI.mutingsRepository)
		private mutingsRepository: MutingsRepository,

		@Inject(DI.notesRepository)
		private notesRepository: NotesRepository,

		@Inject(DI.antennaNotesRepository)
		private antennaNotesRepository: AntennaNotesRepository,

		@Inject(DI.antennasRepository)
		private antennasRepository: AntennasRepository,

		@Inject(DI.userListJoiningsRepository)
		private userListJoiningsRepository: UserListJoiningsRepository,

		private utilityService: UtilityService,
		private idService: IdService,
		private globalEventService: GlobalEventService,
		private pushNotificationService: PushNotificationService,
		private noteEntityService: NoteEntityService,
		private antennaEntityService: AntennaEntityService,
	) {
		this.antennasFetched = false;
		this.antennas = [];

		this.redisSubscriber.on('message', this.onRedisMessage);
	}

	@bindThis
	public onApplicationShutdown(signal?: string | undefined) {
		this.redisSubscriber.off('message', this.onRedisMessage);
	}

	@bindThis
	private async onRedisMessage(_: string, data: string): Promise<void> {
		const obj = JSON.parse(data);

		if (obj.channel === 'internal') {
			const { type, body } = obj.message as StreamMessages['internal']['payload'];
			switch (type) {
				case 'antennaCreated':
					this.antennas.push({
						...body,
						createdAt: new Date(body.createdAt),
					});
					break;
				case 'antennaUpdated':
					this.antennas[this.antennas.findIndex(a => a.id === body.id)] = {
						...body,
						createdAt: new Date(body.createdAt),
					};
					break;
				case 'antennaDeleted':
					this.antennas = this.antennas.filter(a => a.id !== body.id);
					break;
				default:
					break;
			}
		}
	}

	@bindThis
	public async addNoteToAntenna(antenna: Antenna, note: Note, noteUser: { id: User['id']; }): Promise<void> {
		// 通知しない設定になっているか、自分自身の投稿なら既読にする
		const read = !antenna.notify || (antenna.userId === noteUser.id);
	
		this.antennaNotesRepository.insert({
			id: this.idService.genId(),
			antennaId: antenna.id,
			noteId: note.id,
			read: read,
		});
	
		this.globalEventService.publishAntennaStream(antenna.id, 'note', note);
	
		if (!read) {
			const mutings = await this.mutingsRepository.find({
				where: {
					muterId: antenna.userId,
				},
				select: ['muteeId'],
			});
	
			// Copy
			const _note: Note = {
				...note,
			};
	
			if (note.replyId != null) {
				_note.reply = await this.notesRepository.findOneByOrFail({ id: note.replyId });
			}
			if (note.renoteId != null) {
				_note.renote = await this.notesRepository.findOneByOrFail({ id: note.renoteId });
			}
	
			if (isUserRelated(_note, new Set<string>(mutings.map(x => x.muteeId)))) {
				return;
			}
	
			// 2秒経っても既読にならなかったら通知
			setTimeout(async () => {
				const unread = await this.antennaNotesRepository.findOneBy({ antennaId: antenna.id, read: false });
				if (unread) {
					this.globalEventService.publishMainStream(antenna.userId, 'unreadAntenna', antenna);
					this.pushNotificationService.pushNotification(antenna.userId, 'unreadAntennaNote', {
						antenna: { id: antenna.id, name: antenna.name },
						note: await this.noteEntityService.pack(note),
					});
				}
			}, 2000);
		}
	}

	// NOTE: フォローしているユーザーのノート、リストのユーザーのノート、グループのユーザーのノート指定はパフォーマンス上の理由で無効になっている

	@bindThis
	public async checkHitAntenna(antenna: Antenna, note: (Note | Packed<'Note'>), noteUser: { id: User['id']; username: string; host: string | null; }): Promise<boolean> {
		if (note.visibility === 'specified') return false;
		if (note.visibility === 'followers') return false;
	
		if (!antenna.withReplies && note.replyId != null) return false;
	
		if (antenna.src === 'home') {
			// TODO
		} else if (antenna.src === 'list') {
			const listUsers = (await this.userListJoiningsRepository.findBy({
				userListId: antenna.userListId!,
			})).map(x => x.userId);
	
			if (!listUsers.includes(note.userId)) return false;
		} else if (antenna.src === 'users') {
			const accts = antenna.users.map(x => {
				const { username, host } = Acct.parse(x);
				return this.utilityService.getFullApAccount(username, host).toLowerCase();
			});
			if (!accts.includes(this.utilityService.getFullApAccount(noteUser.username, noteUser.host).toLowerCase())) return false;
		}
	
		const keywords = antenna.keywords
			// Clean up
			.map(xs => xs.filter(x => x !== ''))
			.filter(xs => xs.length > 0);
	
		if (keywords.length > 0) {
			if (note.text == null) return false;
	
			const matched = keywords.some(and =>
				and.every(keyword =>
					antenna.caseSensitive
						? note.text!.includes(keyword)
						: note.text!.toLowerCase().includes(keyword.toLowerCase()),
				));
	
			if (!matched) return false;
		}
	
		const excludeKeywords = antenna.excludeKeywords
			// Clean up
			.map(xs => xs.filter(x => x !== ''))
			.filter(xs => xs.length > 0);
	
		if (excludeKeywords.length > 0) {
			if (note.text == null) return false;
	
			const matched = excludeKeywords.some(and =>
				and.every(keyword =>
					antenna.caseSensitive
						? note.text!.includes(keyword)
						: note.text!.toLowerCase().includes(keyword.toLowerCase()),
				));
	
			if (matched) return false;
		}
	
		if (antenna.withFile) {
			if (note.fileIds && note.fileIds.length === 0) return false;
		}
	
		// TODO: eval expression
	
		return true;
	}

	@bindThis
	public async getAntennas() {
		if (!this.antennasFetched) {
			this.antennas = await this.antennasRepository.find();
			this.antennasFetched = true;
		}
	
		return this.antennas;
	}
}

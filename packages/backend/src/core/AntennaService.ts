import { Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import type { Antenna } from '@/models/entities/Antenna.js';
import type { Note } from '@/models/entities/Note.js';
import type { User } from '@/models/entities/User.js';
import { IdService } from '@/core/IdService.js';
import { isUserRelated } from '@/misc/is-user-related.js';
import { GlobalEventService } from '@/core/GlobalEventService.js';
import * as Acct from '@/misc/acct.js';
import { Cache } from '@/misc/cache.js';
import type { Packed } from '@/misc/schema.js';
import { DI } from '@/di-symbols.js';
import type { MutingsRepository, BlockingsRepository, NotesRepository, AntennaNotesRepository, AntennasRepository, UserGroupJoiningsRepository, UserListJoiningsRepository } from '@/models/index.js';
import { UtilityService } from './UtilityService.js';
import type { OnApplicationShutdown } from '@nestjs/common';

@Injectable()
export class AntennaService implements OnApplicationShutdown {
	private antennasFetched: boolean;
	private antennas: Antenna[];
	private blockingCache: Cache<User['id'][]>;

	constructor(
		@Inject(DI.redisSubscriber)
		private redisSubscriber: Redis.Redis,

		@Inject(DI.mutingsRepository)
		private mutingsRepository: MutingsRepository,

		@Inject(DI.blockingsRepository)
		private blockingsRepository: BlockingsRepository,

		@Inject(DI.notesRepository)
		private notesRepository: NotesRepository,

		@Inject(DI.antennaNotesRepository)
		private antennaNotesRepository: AntennaNotesRepository,

		@Inject(DI.antennasRepository)
		private antennasRepository: AntennasRepository,

		@Inject(DI.userGroupJoiningsRepository)
		private userGroupJoiningsRepository: UserGroupJoiningsRepository,

		@Inject(DI.userListJoiningsRepository)
		private userListJoiningsRepository: UserListJoiningsRepository,

		private utilityService: UtilityService,
		private idService: IdService,
		private globalEventServie: GlobalEventService,
	) {
		this.antennasFetched = false;
		this.antennas = [];
		this.blockingCache = new Cache<User['id'][]>(1000 * 60 * 5);

		this.redisSubscriber.on('message', this.onRedisMessage);
	}

	public onApplicationShutdown(signal?: string | undefined) {
		this.redisSubscriber.off('message', this.onRedisMessage);
	}

	private async onRedisMessage(_: string, data: string): Promise<void> {
		const obj = JSON.parse(data);

		if (obj.channel === 'internal') {
			const { type, body } = obj.message;
			switch (type) {
				case 'antennaCreated':
					this.antennas.push(body);
					break;
				case 'antennaUpdated':
					this.antennas[this.antennas.findIndex(a => a.id === body.id)] = body;
					break;
				case 'antennaDeleted':
					this.antennas = this.antennas.filter(a => a.id !== body.id);
					break;
				default:
					break;
			}
		}
	}

	public async addNoteToAntenna(antenna: Antenna, note: Note, noteUser: { id: User['id']; }): Promise<void> {
		// 通知しない設定になっているか、自分自身の投稿なら既読にする
		const read = !antenna.notify || (antenna.userId === noteUser.id);
	
		this.antennaNotesRepository.insert({
			id: this.idService.genId(),
			antennaId: antenna.id,
			noteId: note.id,
			read: read,
		});
	
		this.globalEventServie.publishAntennaStream(antenna.id, 'note', note);
	
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
					this.globalEventServie.publishMainStream(antenna.userId, 'unreadAntenna', antenna);
				}
			}, 2000);
		}
	}

	// NOTE: フォローしているユーザーのノート、リストのユーザーのノート、グループのユーザーのノート指定はパフォーマンス上の理由で無効になっている

	/**
	 * noteUserFollowers / antennaUserFollowing はどちらか一方が指定されていればよい
	 */
	public async checkHitAntenna(antenna: Antenna, note: (Note | Packed<'Note'>), noteUser: { id: User['id']; username: string; host: string | null; }, noteUserFollowers?: User['id'][], antennaUserFollowing?: User['id'][]): Promise<boolean> {
		if (note.visibility === 'specified') return false;
	
		// アンテナ作成者がノート作成者にブロックされていたらスキップ
		const blockings = await this.blockingCache.fetch(noteUser.id, () => this.blockingsRepository.findBy({ blockerId: noteUser.id }).then(res => res.map(x => x.blockeeId)));
		if (blockings.some(blocking => blocking === antenna.userId)) return false;
	
		if (note.visibility === 'followers') {
			if (noteUserFollowers && !noteUserFollowers.includes(antenna.userId)) return false;
			if (antennaUserFollowing && !antennaUserFollowing.includes(note.userId)) return false;
		}
	
		if (!antenna.withReplies && note.replyId != null) return false;
	
		if (antenna.src === 'home') {
			if (noteUserFollowers && !noteUserFollowers.includes(antenna.userId)) return false;
			if (antennaUserFollowing && !antennaUserFollowing.includes(note.userId)) return false;
		} else if (antenna.src === 'list') {
			const listUsers = (await this.userListJoiningsRepository.findBy({
				userListId: antenna.userListId!,
			})).map(x => x.userId);
	
			if (!listUsers.includes(note.userId)) return false;
		} else if (antenna.src === 'group') {
			const joining = await this.userGroupJoiningsRepository.findOneByOrFail({ id: antenna.userGroupJoiningId! });
	
			const groupUsers = (await this.userGroupJoiningsRepository.findBy({
				userGroupId: joining.userGroupId,
			})).map(x => x.userId);
	
			if (!groupUsers.includes(note.userId)) return false;
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

	public async getAntennas() {
		if (!this.antennasFetched) {
			this.antennas = await this.antennasRepository.find();
			this.antennasFetched = true;
		}
	
		return this.antennas;
	}
}

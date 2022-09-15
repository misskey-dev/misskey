import { Inject, Injectable } from '@nestjs/common';
import type { UserGroupJoinings, UserListJoinings , AntennaNotes, Mutings, Notes, Users , Blockings } from '@/models/index.js';
import type { Antenna } from '@/models/entities/Antenna.js';
import type { Note } from '@/models/entities/Note.js';
import type { User } from '@/models/entities/User.js';
import { IdService } from '@/services/IdService.js';
import { isUserRelated } from '@/misc/is-user-related.js';
import { GlobalEventService } from '@/services/GlobalEventService.js';
import * as Acct from '@/misc/acct.js';
import { Cache } from '@/misc/cache.js';
import type { Packed } from '@/misc/schema.js';
import { UtilityService } from './UtilityService.js';

@Injectable()
export class AntennaService {
	#blockingCache: Cache<User['id'][]>;

	constructor(
		@Inject('mutingsRepository')
		private mutingsRepository: typeof Mutings,

		@Inject('blockingsRepository')
		private blockingsRepository: typeof Blockings,

		@Inject('notesRepository')
		private notesRepository: typeof Notes,

		@Inject('antennaNotesRepository')
		private antennaNotesRepository: typeof AntennaNotes,

		@Inject('userGroupJoiningsRepository')
		private userGroupJoiningsRepository: typeof UserGroupJoinings,

		@Inject('userListJoiningsRepository')
		private userListJoiningsRepository: typeof UserListJoinings,

		private utilityService: UtilityService,
		private idService: IdService,
		private globalEventServie: GlobalEventService,
	) {
		this.#blockingCache = new Cache<User['id'][]>(1000 * 60 * 5);
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
		const blockings = await this.#blockingCache.fetch(noteUser.id, () => this.blockingsRepository.findBy({ blockerId: noteUser.id }).then(res => res.map(x => x.blockeeId)));
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
}

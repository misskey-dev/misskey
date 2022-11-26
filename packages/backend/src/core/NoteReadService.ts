import { Inject, Injectable } from '@nestjs/common';
import { In, IsNull, Not } from 'typeorm';
import { DI } from '@/di-symbols.js';
import type { User } from '@/models/entities/User.js';
import type { Channel } from '@/models/entities/Channel.js';
import type { Packed } from '@/misc/schema.js';
import type { Note } from '@/models/entities/Note.js';
import { IdService } from '@/core/IdService.js';
import { GlobalEventService } from '@/core/GlobalEventService.js';
import type { UsersRepository, NoteUnreadsRepository, MutingsRepository, NoteThreadMutingsRepository, FollowingsRepository, ChannelFollowingsRepository, AntennaNotesRepository } from '@/models/index.js';
import { UserEntityService } from './entities/UserEntityService.js';
import { NotificationService } from './NotificationService.js';
import { AntennaService } from './AntennaService.js';

@Injectable()
export class NoteReadService {
	constructor(
		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		@Inject(DI.noteUnreadsRepository)
		private noteUnreadsRepository: NoteUnreadsRepository,

		@Inject(DI.mutingsRepository)
		private mutingsRepository: MutingsRepository,

		@Inject(DI.noteThreadMutingsRepository)
		private noteThreadMutingsRepository: NoteThreadMutingsRepository,

		@Inject(DI.followingsRepository)
		private followingsRepository: FollowingsRepository,

		@Inject(DI.channelFollowingsRepository)
		private channelFollowingsRepository: ChannelFollowingsRepository,

		@Inject(DI.antennaNotesRepository)
		private antennaNotesRepository: AntennaNotesRepository,

		private userEntityService: UserEntityService,
		private idService: IdService,
		private globalEventServie: GlobalEventService,
		private notificationService: NotificationService,
		private antennaService: AntennaService,
	) {
	}

	public async insertNoteUnread(userId: User['id'], note: Note, params: {
		// NOTE: isSpecifiedがtrueならisMentionedは必ずfalse
		isSpecified: boolean;
		isMentioned: boolean;
	}): Promise<void> {
		//#region ミュートしているなら無視
		// TODO: 現在の仕様ではChannelにミュートは適用されないのでよしなにケアする
		const mute = await this.mutingsRepository.findBy({
			muterId: userId,
		});
		if (mute.map(m => m.muteeId).includes(note.userId)) return;
		//#endregion
	
		// スレッドミュート
		const threadMute = await this.noteThreadMutingsRepository.findOneBy({
			userId: userId,
			threadId: note.threadId ?? note.id,
		});
		if (threadMute) return;
	
		const unread = {
			id: this.idService.genId(),
			noteId: note.id,
			userId: userId,
			isSpecified: params.isSpecified,
			isMentioned: params.isMentioned,
			noteChannelId: note.channelId,
			noteUserId: note.userId,
		};
	
		await this.noteUnreadsRepository.insert(unread);
	
		// 2秒経っても既読にならなかったら「未読の投稿がありますよ」イベントを発行する
		setTimeout(async () => {
			const exist = await this.noteUnreadsRepository.findOneBy({ id: unread.id });
	
			if (exist == null) return;
	
			if (params.isMentioned) {
				this.globalEventServie.publishMainStream(userId, 'unreadMention', note.id);
			}
			if (params.isSpecified) {
				this.globalEventServie.publishMainStream(userId, 'unreadSpecifiedNote', note.id);
			}
			if (note.channelId) {
				this.globalEventServie.publishMainStream(userId, 'unreadChannel', note.id);
			}
		}, 2000);
	}	

	public async read(
		userId: User['id'],
		notes: (Note | Packed<'Note'>)[],
		info?: {
			following: Set<User['id']>;
			followingChannels: Set<Channel['id']>;
		},
	): Promise<void> {
		const following = info?.following ? info.following : new Set<string>((await this.followingsRepository.find({
			where: {
				followerId: userId,
			},
			select: ['followeeId'],
		})).map(x => x.followeeId));
		const followingChannels = info?.followingChannels ? info.followingChannels : new Set<string>((await this.channelFollowingsRepository.find({
			where: {
				followerId: userId,
			},
			select: ['followeeId'],
		})).map(x => x.followeeId));
	
		const myAntennas = (await this.antennaService.getAntennas()).filter(a => a.userId === userId);
		const readMentions: (Note | Packed<'Note'>)[] = [];
		const readSpecifiedNotes: (Note | Packed<'Note'>)[] = [];
		const readChannelNotes: (Note | Packed<'Note'>)[] = [];
		const readAntennaNotes: (Note | Packed<'Note'>)[] = [];
	
		for (const note of notes) {
			if (note.mentions && note.mentions.includes(userId)) {
				readMentions.push(note);
			} else if (note.visibleUserIds && note.visibleUserIds.includes(userId)) {
				readSpecifiedNotes.push(note);
			}
	
			if (note.channelId && followingChannels.has(note.channelId)) {
				readChannelNotes.push(note);
			}
	
			if (note.user != null) { // たぶんnullになることは無いはずだけど一応
				for (const antenna of myAntennas) {
					if (await this.antennaService.checkHitAntenna(antenna, note, note.user, undefined, Array.from(following))) {
						readAntennaNotes.push(note);
					}
				}
			}
		}
	
		if ((readMentions.length > 0) || (readSpecifiedNotes.length > 0) || (readChannelNotes.length > 0)) {
			// Remove the record
			await this.noteUnreadsRepository.delete({
				userId: userId,
				noteId: In([...readMentions.map(n => n.id), ...readSpecifiedNotes.map(n => n.id), ...readChannelNotes.map(n => n.id)]),
			});
	
			// TODO: ↓まとめてクエリしたい
	
			this.noteUnreadsRepository.countBy({
				userId: userId,
				isMentioned: true,
			}).then(mentionsCount => {
				if (mentionsCount === 0) {
					// 全て既読になったイベントを発行
					this.globalEventServie.publishMainStream(userId, 'readAllUnreadMentions');
				}
			});
	
			this.noteUnreadsRepository.countBy({
				userId: userId,
				isSpecified: true,
			}).then(specifiedCount => {
				if (specifiedCount === 0) {
					// 全て既読になったイベントを発行
					this.globalEventServie.publishMainStream(userId, 'readAllUnreadSpecifiedNotes');
				}
			});
	
			this.noteUnreadsRepository.countBy({
				userId: userId,
				noteChannelId: Not(IsNull()),
			}).then(channelNoteCount => {
				if (channelNoteCount === 0) {
					// 全て既読になったイベントを発行
					this.globalEventServie.publishMainStream(userId, 'readAllChannels');
				}
			});
	
			this.notificationService.readNotificationByQuery(userId, {
				noteId: In([...readMentions.map(n => n.id), ...readSpecifiedNotes.map(n => n.id)]),
			});
		}
	
		if (readAntennaNotes.length > 0) {
			await this.antennaNotesRepository.update({
				antennaId: In(myAntennas.map(a => a.id)),
				noteId: In(readAntennaNotes.map(n => n.id)),
			}, {
				read: true,
			});
	
			// TODO: まとめてクエリしたい
			for (const antenna of myAntennas) {
				const count = await this.antennaNotesRepository.countBy({
					antennaId: antenna.id,
					read: false,
				});
	
				if (count === 0) {
					this.globalEventServie.publishMainStream(userId, 'readAntenna', antenna);
				}
			}
	
			this.userEntityService.getHasUnreadAntenna(userId).then(unread => {
				if (!unread) {
					this.globalEventServie.publishMainStream(userId, 'readAllAntennas');
				}
			});
		}
	}
}

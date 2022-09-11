import { Inject, Injectable } from '@nestjs/common';
import type { AntennaNotes, Mutings, Notes, Users } from '@/models/index.js';
import type { Antenna } from '@/models/entities/antenna.js';
import type { Note } from '@/models/entities/note.js';
import type { User } from '@/models/entities/user.js';
import { genId } from '@/misc/gen-id.js';
import { isUserRelated } from '@/misc/is-user-related.js';
import type { GlobalEventService } from '@/services/GlobalEventService.js';

@Injectable()
export class AntennaService {
	constructor(
		@Inject('mutingsRepository')
		private mutingsRepository: typeof Mutings,

		@Inject('notesRepository')
		private notesRepository: typeof Notes,

		@Inject('antennaNotesRepository')
		private antennaNotesRepository: typeof AntennaNotes,

		private globalEventServie: GlobalEventService,
	) {
	}

	public async addNoteToAntenna(antenna: Antenna, note: Note, noteUser: { id: User['id']; }): Promise<void> {
		// 通知しない設定になっているか、自分自身の投稿なら既読にする
		const read = !antenna.notify || (antenna.userId === noteUser.id);
	
		this.antennaNotesRepository.insert({
			id: genId(),
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
}

import { Antenna } from '../models/entities/antenna';
import { Note } from '../models/entities/note';
import { AntennaNotes, Mutings, Notes } from '../models';
import { genId } from '../misc/gen-id';
import { isMutedUserRelated } from '../misc/is-muted-user-related';
import { ensure } from '../prelude/ensure';
import { publishAntennaStream, publishMainStream } from './stream';
import { User } from '../models/entities/user';

export async function addNoteToAntenna(antenna: Antenna, note: Note, noteUser: User) {
	// 通知しない設定になっているか、自分自身の投稿なら既読にする
	const read = !antenna.notify || (antenna.userId === noteUser.id);

	AntennaNotes.save({
		id: genId(),
		antennaId: antenna.id,
		noteId: note.id,
		read: read,
	});

	publishAntennaStream(antenna.id, 'note', note);

	if (!read) {
		const mutings = await Mutings.find({
			where: {
				muterId: antenna.userId
			},
			select: ['muteeId']
		});

		const _note: Note = {
			...note
		};

		if (note.replyId != null) {
			_note.reply = await Notes.findOne(note.replyId).then(ensure);
		}
		if (note.renoteId != null) {
			_note.renote = await Notes.findOne(note.renoteId).then(ensure);
		}

		if (isMutedUserRelated(_note, mutings.map(x => x.muteeId))) {
			return;
		}

		// 2秒経っても既読にならなかったら通知
		setTimeout(async () => {
			const unread = await AntennaNotes.findOne({ antennaId: antenna.id, read: false });
			if (unread) {
				publishMainStream(antenna.userId, 'unreadAntenna', antenna);
			}
		}, 2000);
	}
}

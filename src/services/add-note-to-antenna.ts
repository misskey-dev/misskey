import { Antenna } from '../models/entities/antenna';
import { Note } from '../models/entities/note';
import { AntennaNotes, Mutings, Notes } from '../models';
import { genId } from '../misc/gen-id';
import shouldMuteThisNote from '../misc/should-mute-this-note';
import { ensure } from '../prelude/ensure';
import { publishAntennaStream, publishMainStream } from './stream';

export async function addNoteToAntenna(antenna: Antenna, note: Note) {
	AntennaNotes.save({
		id: genId(),
		antennaId: antenna.id,
		noteId: note.id,
		read: !antenna.notify,
	});

	publishAntennaStream(antenna.id, 'note', note);

	if (antenna.notify) {
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
		
		if (shouldMuteThisNote(_note, mutings.map(x => x.muteeId))) {
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

import { Antenna } from '../models/entities/antenna';
import { Note } from '../models/entities/note';
import { AntennaNotes, Mutings, Notes, Antennas } from '../models';
import { genId } from '../misc/gen-id';
import shouldMuteThisNote from '../misc/should-mute-this-note';
import { ensure } from '../prelude/ensure';
import { publishAntennaStream, publishMainStream } from './stream';

export async function addNoteToAntenna(antenna: Antenna, note: Note) {
	AntennaNotes.save({
		id: genId(),
		antennaId: antenna.id,
		noteId: note.id,
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

		await Antennas.update(antenna.id, {
			hasNewNote: true
		});

		// 2秒経っても既読にならなかったら通知
		setTimeout(async () => {
			const fresh = await Antennas.findOne(antenna.id);
			if (fresh == null) return; // 既に削除されているかもしれない
			if (!fresh.hasNewNote) {
				publishMainStream(antenna.userId, 'unreadAntenna', antenna);
			}
		}, 2000);
	}
}

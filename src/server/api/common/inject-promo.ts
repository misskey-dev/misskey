import rndstr from 'rndstr';
import { Note } from '../../../models/entities/note';
import { User } from '../../../models/entities/user';
import { PromoReads, PromoNotes, Notes, Users } from '../../../models';
import { ensure } from '../../../prelude/ensure';

export async function injectPromo(user: User, timeline: Note[]) {
	if (timeline.length < 5) return;

	// TODO: readやexpireフィルタはクエリ側でやる

	const reads = await PromoReads.find({
		userId: user.id
	});

	let promos = await PromoNotes.find();

	promos = promos.filter(n => n.expiresAt.getTime() > Date.now());
	promos = promos.filter(n => !reads.map(r => r.noteId).includes(n.noteId));

	if (promos.length === 0) return;

	const promo = promos[Math.floor(Math.random() * promos.length)];

	// Pick random promo
	const note = await Notes.findOne(promo.noteId).then(ensure);

	// Join
	note.user = await Users.findOne(note.userId).then(ensure);

	(note as any)._prInjectionId_ = rndstr('a-z0-9', 8);

	// Inject promo
	timeline.splice(3, 0, note);
}

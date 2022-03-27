import rndstr from 'rndstr';
import { Note } from '@/models/entities/note.js';
import { User } from '@/models/entities/user.js';
import { PromoReads, PromoNotes, Notes, Users } from '@/models/index.js';

export async function injectPromo(timeline: Note[], user?: User | null) {
	if (timeline.length < 5) return;

	// TODO: readやexpireフィルタはクエリ側でやる

	const reads = user ? await PromoReads.findBy({
		userId: user.id,
	}) : [];

	let promos = await PromoNotes.find();

	promos = promos.filter(n => n.expiresAt.getTime() > Date.now());
	promos = promos.filter(n => !reads.map(r => r.noteId).includes(n.noteId));

	if (promos.length === 0) return;

	// Pick random promo
	const promo = promos[Math.floor(Math.random() * promos.length)];

	const note = await Notes.findOneByOrFail({ id: promo.noteId });

	// Join
	note.user = await Users.findOneByOrFail({ id: note.userId });

	(note as any)._prId_ = rndstr('a-z0-9', 8);

	// Inject promo
	timeline.splice(3, 0, note);
}

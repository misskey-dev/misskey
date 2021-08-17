import rndstr from 'rndstr';
import { Note } from '../../../models/entities/note';
import { User } from '../../../models/entities/user';
import { Notes, UserProfiles, NoteReactions } from '../../../models';
import { generateMutedUserQuery } from './generate-muted-user-query';
import { generateBlockedUserQuery } from './generate-block-query';

// TODO: リアクション、Renote、返信などをしたノートは除外する

export async function injectFeatured(timeline: Note[], user?: User | null) {
	if (timeline.length < 5) return;

	if (user) {
		const profile = await UserProfiles.findOneOrFail(user.id);
		if (!profile.injectFeaturedNote) return;
	}

	const max = 30;
	const day = 1000 * 60 * 60 * 24 * 3; // 3日前まで

	const query = Notes.createQueryBuilder('note')
		.addSelect('note.score')
		.where('note.userHost IS NULL')
		.andWhere(`note.score > 0`)
		.andWhere(`note.createdAt > :date`, { date: new Date(Date.now() - day) })
		.andWhere(`note.visibility = 'public'`)
		.innerJoinAndSelect('note.user', 'user');

	if (user) {
		query.andWhere('note.userId != :userId', { userId: user.id });

		generateMutedUserQuery(query, user);
		generateBlockedUserQuery(query, user);

		const reactionQuery = NoteReactions.createQueryBuilder('reaction')
			.select('reaction.noteId')
			.where('reaction.userId = :userId', { userId: user.id });

		query.andWhere(`note.id NOT IN (${ reactionQuery.getQuery() })`);
	}

	const notes = await query
		.orderBy('note.score', 'DESC')
		.take(max)
		.getMany();

	if (notes.length === 0) return;

	// Pick random one
	const featured = notes[Math.floor(Math.random() * notes.length)];

	(featured as any)._featuredId_ = rndstr('a-z0-9', 8);

	// Inject featured
	timeline.splice(3, 0, featured);
}

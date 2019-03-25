import { Feed } from 'feed';
import config from '../../config';
import { User } from '../../models/entities/user';
import { Notes, DriveFiles } from '../../models';

export default async function(user: User) {
	const author: Author = {
		link: `${config.url}/@${user.username}`,
		name: user.name || user.username
	};

	const notes = await Notes.find({
		userId: user.id,
		renoteId: null,
		$or: [
			{ visibility: 'public' },
			{ visibility: 'home' }
		]
	}, {
		sort: { createdAt: -1 },
		limit: 20
	});

	const feed = new Feed({
		id: author.link,
		title: `${author.name} (@${user.username}@${config.host})`,
		updated: notes[0].createdAt,
		generator: 'Misskey',
		description: `${user.notesCount} Notes, ${user.followingCount} Following, ${user.followersCount} Followers${user.description ? ` · ${user.description}` : ''}`,
		link: author.link,
		image: user.avatarUrl,
		feedLinks: {
			json: `${author.link}.json`,
			atom: `${author.link}.atom`,
		},
		author
	} as FeedOptions);

	for (const note of notes) {
		const file = note._files && note._files.find(file => file.contentType.startsWith('image/'));

		feed.addItem({
			title: `New note by ${author.name}`,
			link: `${config.url}/notes/${note.id}`,
			date: note.createdAt,
			description: note.cw,
			content: note.text,
			image: file ? DriveFiles.getPublicUrl(file) : null
		});
	}

	return feed;
}

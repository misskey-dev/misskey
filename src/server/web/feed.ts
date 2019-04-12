import { Feed } from 'feed';
import config from '../../config';
import { User } from '../../models/entities/user';
import { Notes, DriveFiles, UserProfiles } from '../../models';
import { In } from 'typeorm';
import { ensure } from '../../prelude/ensure';

export default async function(user: User) {
	const author: Author = {
		link: `${config.url}/@${user.username}`,
		name: user.name || user.username
	};

	const profile = await UserProfiles.findOne({ userId: user.id }).then(ensure);

	const notes = await Notes.find({
		where: {
			userId: user.id,
			renoteId: null,
			visibility: In(['public', 'home'])
		},
		order: { createdAt: -1 },
		take: 20
	});

	const feed = new Feed({
		id: author.link,
		title: `${author.name} (@${user.username}@${config.host})`,
		updated: notes[0].createdAt,
		generator: 'Misskey',
		description: `${user.notesCount} Notes, ${user.followingCount} Following, ${user.followersCount} Followers${profile.description ? ` · ${profile.description}` : ''}`,
		link: author.link,
		image: user.avatarUrl,
		feedLinks: {
			json: `${author.link}.json`,
			atom: `${author.link}.atom`,
		},
		author
	} as FeedOptions);

	for (const note of notes) {
		const files = note.fileIds.length > 0 ? await DriveFiles.find({
			id: In(note.fileIds)
		}) : [];
		const file = files.find(file => file.type.startsWith('image/'));

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

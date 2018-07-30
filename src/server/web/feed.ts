import { IUser } from "../../models/user";
import Note from "../../models/note";

const Feed = require('feed');

export default async function(user: IUser) {
	let feed = new Feed({
		title: user.name || user.username,
		description: 'This is my personal feed!',
		id: 'http://example.com/',
		link: 'http://example.com/',
		image: 'http://example.com/image.png',
		generator: 'Misskey',
		feedLinks: {
			json: 'https://example.com/json',
			atom: 'https://example.com/atom',
		},
		author: {
			name: user.name || user.username,
			link: 'https://example.com/johndoe'
		}
	});

	const notes = await Note.find({
		userId: user._id,
		visibility: {
			$or: ['public', 'home']
		}
	});

	notes.forEach(note => {
		feed.addItem({
			title: note.title,
			id: note.url,
			link: note.url,
			description: note.description,
			content: note.content,
			date: note.createdAt,
			image: note.image
		});
	});

	return feed.atom1();
}

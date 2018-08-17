import config from '../../../config';
import { INote } from '../../../models/note';

export default (object: any, note: INote) => {
	const attributedTo = `${config.url}/users/${note.userId}`;

	return {
		id: `${config.url}/notes/${note._id}`,
		type: 'Announce',
		published: note.createdAt.toISOString(),
		to: ['https://www.w3.org/ns/activitystreams#Public'],
		cc: [attributedTo, `${attributedTo}/followers`],
		object
	};
};

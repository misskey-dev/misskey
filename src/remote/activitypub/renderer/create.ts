import config from '../../../config';
import { INote } from '../../../models/note';

export default (object: any, note: INote) => {
	return {
		id: `${config.url}/notes/${note._id}/activity`,
		actor: `${config.url}/users/${note.userId}`,
		type: 'Create',
		published: note.createdAt.toISOString(),
		object
	};
};

import config from '../../../config';
import { INote } from '../../../models/note';

export default (object: any, note: INote) => {
	const activity = {
		id: `${config.url}/notes/${note._id}/activity`,
		actor: `${config.url}/users/${note.userId}`,
		type: 'Create',
		published: note.createdAt.toISOString(),
		object
	} as any;

	if (object.to) activity.to = object.to;
	if (object.cc) activity.cc = object.cc;

	return activity;
};

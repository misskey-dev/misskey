import { IRemoteUser } from '../../../../models/user';
import * as debug from 'debug';
import { IUpdate } from '../../type';
import { extractPollFromQuestion } from '../../models/question';
import Note from '../../../../models/note';

const log = debug('misskey:activitypub');

export default async (actor: IRemoteUser, activity: IUpdate): Promise<void> => {
	const id = typeof activity.object == 'string' ? activity.object : activity.object.id;
	const type = (activity.object as any).type;

	log(`Update<${type}>: ${id}`);

	switch (type) {
		case 'Question':
			const note = await Note.findOne({
				questionUri: id
			});

			if (note === null) throw 'note not found';

			const poll = await extractPollFromQuestion(id);

			await Note.update({
				_id: note._id
			}, {
				$set: {
					poll
				}
			});
			break;
	}
};

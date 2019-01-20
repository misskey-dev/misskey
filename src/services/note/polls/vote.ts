import Vote from '../../../models/poll-vote';
import Note, { INote } from '../../../models/note';
import { IUser } from '../../../models/user';

export default (user: IUser, note: INote, choice: number) => new Promise(async (res, rej) => {
	if (!note.poll.choices.some(x => x.id == choice)) return rej('invalid choice param');

	// if already voted
	const exist = await Vote.findOne({
		noteId: note._id,
		userId: user._id
	});

	if (exist !== null) {
		return rej('already voted');
	}

	// Create vote
	await Vote.insert({
		createdAt: new Date(),
		noteId: note._id,
		userId: user._id,
		choice: choice
	});

	// Send response
	res();

	const inc: any = {};
	inc[`poll.choices.${note.poll.choices.findIndex(c => c.id == choice)}.votes`] = 1;

	// Increment votes count
	await Note.update({ _id: note._id }, {
		$inc: inc
	});
});

import * as mongo from 'mongodb';
import db from '../db/mongodb';

const PollVote = db.get<IPollVote>('pollVotes');
export default PollVote;

export interface IPollVote {
	_id: mongo.ObjectID;
	createdAt: Date;
	userId: mongo.ObjectID;
	noteId: mongo.ObjectID;
	choice: number;
}

/**
 * PollVoteを物理削除します
 */
export async function deletePollVote(pollVote: string | mongo.ObjectID | IPollVote) {
	let p: IPollVote;

	// Populate
	if (mongo.ObjectID.prototype.isPrototypeOf(pollVote)) {
		p = await PollVote.findOne({
			_id: pollVote
		});
	} else if (typeof pollVote === 'string') {
		p = await PollVote.findOne({
			_id: new mongo.ObjectID(pollVote)
		});
	} else {
		p = pollVote as IPollVote;
	}

	if (p == null) return;

	// このPollVoteを削除
	await PollVote.remove({
		_id: p._id
	});
}

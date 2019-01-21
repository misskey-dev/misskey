import * as mongo from 'mongodb';
import db from '../db/mongodb';

const PollVote = db.get<IPollVote>('pollVotes');
PollVote.createIndex('userId');
PollVote.createIndex('noteId');
PollVote.createIndex(['userId', 'noteId'], { unique: true });
export default PollVote;

export interface IPollVote {
	_id: mongo.ObjectID;
	createdAt: Date;
	userId: mongo.ObjectID;
	noteId: mongo.ObjectID;
	choice: number;
}

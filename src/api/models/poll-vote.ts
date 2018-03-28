import * as mongo from 'mongodb';
import db from '../../db/mongodb';

const PollVote = db.get<IPollVote>('pollVotes');
export default PollVote;

export interface IPollVote {
	_id: mongo.ObjectID;
	createdAt: Date;
	userId: mongo.ObjectID;
	postId: mongo.ObjectID;
	choice: number;
}

<<<<<<< HEAD:src/server/api/models/poll-vote.ts
import db from '../../../db/mongodb';
=======
import * as mongo from 'mongodb';
import db from '../../db/mongodb';
>>>>>>> refs/remotes/origin/master:src/api/models/poll-vote.ts

const PollVote = db.get<IPollVote>('pollVotes');
export default PollVote;

export interface IPollVote {
	_id: mongo.ObjectID;
	createdAt: Date;
	userId: mongo.ObjectID;
	postId: mongo.ObjectID;
	choice: number;
}

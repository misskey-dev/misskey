import * as mongo from 'mongodb';
import db from '../db/mongodb';

const Contributor = db.get<IContributors>('contributors');
Contributor.createIndex('userId');
Contributor.createIndex('session');
export default Contributor;

export type IContributors = {
	_id: mongo.ObjectID;
	userId: number;
	type: 'owner' | 'collaborator' | 'contributor';
	session: string;
};

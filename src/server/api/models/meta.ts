import db from '../../../db/mongodb';

export default db.get('meta') as any; // fuck type definition

export type IMeta = {
	top_image: string;
};

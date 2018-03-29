import db from '../../../db/mongodb';

const Meta = db.get<IMeta>('meta');
export default Meta;

export type IMeta = {
	broadcasts: any[];
};

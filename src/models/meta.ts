import db from '../db/mongodb';

const Meta = db.get<IMeta>('meta');
export default Meta;

export type IMeta = {
	broadcasts?: any[];
	stats?: {
		notesCount: number;
		originalNotesCount: number;
		usersCount: number;
		originalUsersCount: number;
	};
	disableRegistration?: boolean;
	disableLocalTimeline?: boolean;
	hidedTags?: string[];
	bannerUrl?: string;
};

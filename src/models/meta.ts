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

	/**
	 * カスタム絵文字定義
	 */
	emojis?: {
		/**
		 * 絵文字名 (例: thinking_ai)
		 */
		name: string;

		/**
		 * エイリアス
		 */
		aliases?: string[];

		/**
		 * 絵文字画像のURL
		 */
		url: string;
	}[];
};

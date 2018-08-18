import * as mongo from 'mongodb';
import db from '../db/mongodb';

const Chart = db.get<IChart>('chart');
Chart.createIndex('date', { unique: true });
export default Chart;

export interface IChart {
	_id: mongo.ObjectID;

	date: Date;

	/**
	 * ユーザーに関する統計
	 */
	users: {
		local: {
			/**
			 * この日時点での、ローカルのユーザーの総計
			 */
			total: number;

			/**
			 * ローカルのユーザー数の前日比
			 */
			diff: number;
		};

		remote: {
			/**
			 * この日時点での、リモートのユーザーの総計
			 */
			total: number;

			/**
			 * リモートのユーザー数の前日比
			 */
			diff: number;
		};
	};

	/**
	 * 投稿に関する統計
	 */
	notes: {
		local: {
			/**
			 * この日時点での、ローカルの投稿の総計
			 */
			total: number;

			/**
			 * ローカルの投稿数の前日比
			 */
			diff: number;

			diffs: {
				/**
				 * ローカルの通常の投稿数の前日比
				 */
				normal: number;

				/**
				 * ローカルのリプライの投稿数の前日比
				 */
				reply: number;

				/**
				 * ローカルのRenoteの投稿数の前日比
				 */
				renote: number;
			};
		};

		remote: {
			/**
			 * この日時点での、リモートの投稿の総計
			 */
			total: number;

			/**
			 * リモートの投稿数の前日比
			 */
			diff: number;

			diffs: {
				/**
				 * リモートの通常の投稿数の前日比
				 */
				normal: number;

				/**
				 * リモートのリプライの投稿数の前日比
				 */
				reply: number;

				/**
				 * リモートのRenoteの投稿数の前日比
				 */
				renote: number;
			};
		};
	};

	/**
	 * ドライブ(のファイル)に関する統計
	 */
	drive: {
		local: {
			/**
			 * この日時点での、ローカルのドライブファイル数の総計
			 */
			totalCount: number;

			/**
			 * この日時点での、ローカルのドライブファイルサイズの総計
			 */
			totalSize: number;

			/**
			 * ローカルのドライブファイル数の前日比
			 */
			diffCount: number;

			/**
			 * ローカルのドライブファイルサイズの前日比
			 */
			diffSize: number;
		};

		remote: {
			/**
			 * この日時点での、リモートのドライブファイル数の総計
			 */
			totalCount: number;

			/**
			 * この日時点での、リモートのドライブファイルサイズの総計
			 */
			totalSize: number;

			/**
			 * リモートのドライブファイル数の前日比
			 */
			diffCount: number;

			/**
			 * リモートのドライブファイルサイズの前日比
			 */
			diffSize: number;
		};
	};
}

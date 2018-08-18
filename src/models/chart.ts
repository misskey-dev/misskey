import * as mongo from 'mongodb';
import db from '../db/mongodb';

const Chart = db.get<IChart>('chart');
Chart.createIndex('date', { unique: true });
export default Chart;

export interface IChart {
	_id: mongo.ObjectID;

	date: Date;

	users: {
		local: {
			/**
			 * この日時点での、ローカルのユーザーの総計
			 */
			total: number;

			/**
			 * この日時点での、ローカルのユーザー数の前日比
			 */
			diff: number;
		};

		remote: {
			/**
			 * この日時点での、リモートのユーザーの総計
			 */
			total: number;

			/**
			 * この日時点での、リモートのユーザー数の前日比
			 */
			diff: number;
		};
	};

	notes: {
		local: {
			/**
			 * この日時点での、ローカルの投稿の総計
			 */
			total: number;

			diffs: {
				/**
				 * この日に行われた、ローカルの通常の投稿数の前日比
				 */
				normal: number;

				/**
				 * この日に行われた、ローカルのリプライの投稿数の前日比
				 */
				reply: number;

				/**
				 * この日に行われた、ローカルのRenoteの投稿数の前日比
				 */
				renote: number;
			};
		};

		remote: {
			/**
			 * この日時点での、リモートの投稿の総計
			 */
			total: number;

			diffs: {
				/**
				 * この日に行われた、リモートの通常の投稿数の前日比
				 */
				normal: number;

				/**
				 * この日に行われた、リモートのリプライの投稿数の前日比
				 */
				reply: number;

				/**
				 * この日に行われた、リモートのRenoteの投稿数の前日比
				 */
				renote: number;
			};
		};
	};
}

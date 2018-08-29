import * as mongo from 'mongodb';
import db from '../db/mongodb';

const Stats = db.get<IStats>('stats');
Stats.dropIndex({ date: -1 }); // 後方互換性のため
Stats.createIndex({ span: -1, date: -1 }, { unique: true });
export default Stats;

export interface IStats {
	_id: mongo.ObjectID;

	/**
	 * 集計日時
	 */
	date: Date;

	/**
	 * 集計期間
	 */
	span: 'day' | 'hour';

	/**
	 * ユーザーに関する統計
	 */
	users: {
		local: {
			/**
			 * 集計期間時点での、全ユーザー数 (ローカル)
			 */
			total: number;

			/**
			 * 増加したユーザー数 (ローカル)
			 */
			inc: number;

			/**
			 * 減少したユーザー数 (ローカル)
			 */
			dec: number;
		};

		remote: {
			/**
			 * 集計期間時点での、全ユーザー数 (リモート)
			 */
			total: number;

			/**
			 * 増加したユーザー数 (リモート)
			 */
			inc: number;

			/**
			 * 減少したユーザー数 (リモート)
			 */
			dec: number;
		};
	};

	/**
	 * 投稿に関する統計
	 */
	notes: {
		local: {
			/**
			 * 集計期間時点での、全投稿数 (ローカル)
			 */
			total: number;

			/**
			 * 増加した投稿数 (ローカル)
			 */
			inc: number;

			/**
			 * 減少した投稿数 (ローカル)
			 */
			dec: number;

			diffs: {
				/**
				 * 通常の投稿数の差分 (ローカル)
				 */
				normal: number;

				/**
				 * リプライの投稿数の差分 (ローカル)
				 */
				reply: number;

				/**
				 * Renoteの投稿数の差分 (ローカル)
				 */
				renote: number;
			};
		};

		remote: {
			/**
			 * 集計期間時点での、全投稿数 (リモート)
			 */
			total: number;

			/**
			 * 増加した投稿数 (リモート)
			 */
			inc: number;

			/**
			 * 減少した投稿数 (リモート)
			 */
			dec: number;

			diffs: {
				/**
				 * 通常の投稿数の差分 (リモート)
				 */
				normal: number;

				/**
				 * リプライの投稿数の差分 (リモート)
				 */
				reply: number;

				/**
				 * Renoteの投稿数の差分 (リモート)
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
			 * 集計期間時点での、全ドライブファイル数 (ローカル)
			 */
			totalCount: number;

			/**
			 * 集計期間時点での、全ドライブファイルの合計サイズ (ローカル)
			 */
			totalSize: number;

			/**
			 * 増加したドライブファイル数 (ローカル)
			 */
			incCount: number;

			/**
			 * 増加したドライブ使用量 (ローカル)
			 */
			incSize: number;

			/**
			 * 減少したドライブファイル数 (ローカル)
			 */
			decCount: number;

			/**
			 * 減少したドライブ使用量 (ローカル)
			 */
			decSize: number;
		};

		remote: {
			/**
			 * 集計期間時点での、全ドライブファイル数 (リモート)
			 */
			totalCount: number;

			/**
			 * 集計期間時点での、全ドライブファイルの合計サイズ (リモート)
			 */
			totalSize: number;

			/**
			 * 増加したドライブファイル数 (リモート)
			 */
			incCount: number;

			/**
			 * 増加したドライブ使用量 (リモート)
			 */
			incSize: number;

			/**
			 * 減少したドライブファイル数 (リモート)
			 */
			decCount: number;

			/**
			 * 減少したドライブ使用量 (リモート)
			 */
			decSize: number;
		};
	};
}

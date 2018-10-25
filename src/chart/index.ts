/**
 * チャートエンジン
 */

const nestedProperty = require('nested-property');
import autobind from 'autobind-decorator';
import * as mongo from 'mongodb';
import db from '../db/mongodb';
import { ICollection } from 'monk';

export type Obj = { [key: string]: any };

export type Partial<T> = {
	[P in keyof T]?: Partial<T[P]>;
};

type ArrayValue<T> = {
	[P in keyof T]: T[P] extends number ? Array<T[P]> : ArrayValue<T[P]>;
};

type Span = 'day' | 'hour';

type Log<T extends Obj> = {
	_id: mongo.ObjectID;

	/**
	 * 集計のグループ
	 */
	group?: any;

	/**
	 * 集計日時
	 */
	date: Date;

	/**
	 * 集計期間
	 */
	span: Span;

	/**
	 * データ
	 */
	data: T;

	/**
	 * ユニークインクリメント用
	 */
	unique?: Obj;
};

/**
 * 様々なチャートの管理を司るクラス
 */
export default abstract class Chart<T> {
	protected collection: ICollection<Log<T>>;
	protected abstract async getTemplate(init: boolean, latest?: T, group?: any): Promise<T>;

	constructor(name: string, grouped = false) {
		this.collection = db.get<Log<T>>(`chart.${name}`);
		if (grouped) {
			this.collection.createIndex({ span: -1, date: -1, group: -1 }, { unique: true });
		} else {
			this.collection.createIndex({ span: -1, date: -1 }, { unique: true });
		}
	}

	@autobind
	private convertQuery(x: Obj, path: string): Obj {
		const query: Obj = {};

		const dive = (x: Obj, path: string) => {
			Object.entries(x).forEach(([k, v]) => {
				const p = path ? `${path}.${k}` : k;
				if (typeof v === 'number') {
					query[p] = v;
				} else {
					dive(v, p);
				}
			});
		};

		dive(x, path);

		return query;
	}

	@autobind
	private getCurrentDate(): [number, number, number, number] {
		const now = new Date();

		const y = now.getFullYear();
		const m = now.getMonth();
		const d = now.getDate();
		const h = now.getHours();

		return [y, m, d, h];
	}

	@autobind
	private getLatestLog(span: Span, group?: any): Promise<Log<T>> {
		return this.collection.findOne({
			group: group,
			span: span
		}, {
			sort: {
				date: -1
			}
		});
	}

	@autobind
	private async getCurrentLog(span: Span, group?: any): Promise<Log<T>> {
		const [y, m, d, h] = this.getCurrentDate();

		const current =
			span == 'day' ? new Date(y, m, d) :
			span == 'hour' ? new Date(y, m, d, h) :
			null;

		// 現在(今日または今のHour)のログ
		const currentLog = await this.collection.findOne({
			group: group,
			span: span,
			date: current
		});

		// ログがあればそれを返して終了
		if (currentLog != null) {
			return currentLog;
		}

		let log: Log<T>;
		let data: T;

		// 集計期間が変わってから、初めてのチャート更新なら
		// 最も最近のログを持ってくる
		// * 例えば集計期間が「日」である場合で考えると、
		// * 昨日何もチャートを更新するような出来事がなかった場合は、
		// * ログがそもそも作られずドキュメントが存在しないということがあり得るため、
		// * 「昨日の」と決め打ちせずに「もっとも最近の」とします
		const latest = await this.getLatestLog(span, group);

		if (latest != null) {
			// 空ログデータを作成
			data = await this.getTemplate(false, latest.data);
		} else {
			// ログが存在しなかったら
			// (Misskeyインスタンスを建てて初めてのチャート更新時など
			// または何らかの理由でチャートコレクションを抹消した場合)

			// 初期ログデータを作成
			data = await this.getTemplate(true, null, group);
		}

		try {
			// 新規ログ挿入
			log = await this.collection.insert({
				group: group,
				span: span,
				date: current,
				data: data
			});
		} catch (e) {
			// 11000 is duplicate key error
			// 並列動作している他のチャートエンジンプロセスと処理が重なる場合がある
			// その場合は再度最も新しいログを持ってくる
			if (e.code === 11000) {
				log = await this.getLatestLog(span, group);
			} else {
				console.error(e);
				throw e;
			}
		}

		return log;
	}

	@autobind
	protected commit(query: Obj, group?: any, uniqueKey?: string, uniqueValue?: string): void {
		const update = (log: Log<T>) => {
			// ユニークインクリメントの場合、指定のキーに指定の値が既に存在していたら弾く
			if (
				uniqueKey &&
				log.unique &&
				log.unique[uniqueKey] &&
				log.unique[uniqueKey].includes(uniqueValue)
			) return;

			// ユニークインクリメントの指定のキーに値を追加
			if (uniqueKey) {
				query['$push'] = {
					[`unique.${uniqueKey}`]: uniqueValue
				};
			}

			// ログ更新
			this.collection.update({
				_id: log._id
			}, query);
		};

		this.getCurrentLog('day', group).then(log => update(log));
		this.getCurrentLog('hour', group).then(log => update(log));
	}

	@autobind
	protected inc(inc: Partial<T>, group?: any): void {
		this.commit({
			$inc: this.convertQuery(inc, 'data')
		}, group);
	}

	@autobind
	protected incIfUnique(inc: Partial<T>, key: string, value: string, group?: any): void {
		this.commit({
			$inc: this.convertQuery(inc, 'data')
		}, group, key, value);
	}

	@autobind
	public async getChart(span: Span, range: number, group?: any): Promise<ArrayValue<T>> {
		const promisedChart: Promise<T>[] = [];

		const [y, m, d, h] = this.getCurrentDate();

		const gt =
			span == 'day' ? new Date(y, m, d - range) :
			span == 'hour' ? new Date(y, m, d, h - range) :
			null;

		// ログ取得
		const logs = await this.collection.find({
			group: group,
			span: span,
			date: {
				$gt: gt
			}
		}, {
			sort: {
				date: -1
			},
			fields: {
				_id: 0
			}
		});

		// 整形
		for (let i = (range - 1); i >= 0; i--) {
			const current =
				span == 'day' ? new Date(y, m, d - i) :
				span == 'hour' ? new Date(y, m, d, h - i) :
				null;

			const log = logs.find(l => l.date.getTime() == current.getTime());

			if (log) {
				promisedChart.unshift(Promise.resolve(log.data));
			} else {
				// 隙間埋め
				const latest = logs.find(l => l.date.getTime() < current.getTime());
				promisedChart.unshift(this.getTemplate(false, latest ? latest.data : null));
			}
		}

		const chart = await Promise.all(promisedChart);

		const res: ArrayValue<T> = {} as any;

		/**
		 * [{
		 * 	xxxxx: 1,
		 * 	yyyyy: 5
		 * }, {
		 * 	xxxxx: 2,
		 * 	yyyyy: 6
		 * }, {
		 * 	xxxxx: 3,
		 * 	yyyyy: 7
		 * }]
		 *
		 * を
		 *
		 * {
		 * 	xxxxx: [1, 2, 3],
		 * 	yyyyy: [5, 6, 7]
		 * }
		 *
		 * にする
		 */
		const dive = (x: Obj, path?: string) => {
			Object.entries(x).forEach(([k, v]) => {
				const p = path ? `${path}.${k}` : k;
				if (typeof v == 'object') {
					dive(v, p);
				} else {
					nestedProperty.set(res, p, chart.map(s => nestedProperty.get(s, p)));
				}
			});
		};

		dive(chart[0]);

		return res;
	}
}

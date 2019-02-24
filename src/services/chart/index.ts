/**
 * チャートエンジン
 */

import * as moment from 'moment';
import * as nestedProperty from 'nested-property';
import autobind from 'autobind-decorator';
import * as mongo from 'mongodb';
import db from '../../db/mongodb';
import { ICollection } from 'monk';
import Logger from '../../misc/logger';
import { Schema } from '../../prelude/schema';

const logger = new Logger('chart');

const utc = moment.utc;

export type Obj = { [key: string]: any };

export type Partial<T> = {
	[P in keyof T]?: Partial<T[P]>;
};

type ArrayValue<T> = {
	[P in keyof T]: T[P] extends number ? T[P][] : ArrayValue<T[P]>;
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
export default abstract class Chart<T extends Obj> {
	protected collection: ICollection<Log<T>>;
	protected abstract async getTemplate(init: boolean, latest?: T, group?: any): Promise<T>;
	private name: string;

	constructor(name: string, grouped = false) {
		this.name = name;
		this.collection = db.get<Log<T>>(`chart.${name}`);

		const keys = {
			span: -1,
			date: -1
		} as { [key: string]: 1 | -1; };
		if (grouped) keys.group = -1;

		this.collection.createIndex(keys, { unique: true });
	}

	@autobind
	private convertQuery(x: Obj, path: string): Obj {
		const query: Obj = {};

		const dive = (x: Obj, path: string) => {
			for (const [k, v] of Object.entries(x)) {
				const p = path ? `${path}.${k}` : k;
				if (typeof v === 'number') {
					query[p] = v;
				} else {
					dive(v, p);
				}
			}
		};

		dive(x, path);

		return query;
	}

	@autobind
	private getCurrentDate(): [number, number, number, number] {
		const now = moment().utc();

		const y = now.year();
		const m = now.month();
		const d = now.date();
		const h = now.hour();

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
			span == 'day' ? utc([y, m, d]) :
			span == 'hour' ? utc([y, m, d, h]) :
			null;

		// 現在(今日または今のHour)のログ
		const currentLog = await this.collection.findOne({
			group: group,
			span: span,
			date: current.toDate()
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

			logger.info(`${this.name}: Initial commit created`);
		}

		try {
			// 新規ログ挿入
			log = await this.collection.insert({
				group: group,
				span: span,
				date: current.toDate(),
				data: data
			});
		} catch (e) {
			// 11000 is duplicate key error
			// 並列動作している他のチャートエンジンプロセスと処理が重なる場合がある
			// その場合は再度最も新しいログを持ってくる
			if (e.code === 11000) {
				log = await this.getLatestLog(span, group);
			} else {
				logger.error(e);
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
			span == 'day' ? utc([y, m, d]).subtract(range, 'days') :
			span == 'hour' ? utc([y, m, d, h]).subtract(range, 'hours') :
			null;

		// ログ取得
		let logs = await this.collection.find({
			group: group,
			span: span,
			date: {
				$gte: gt.toDate()
			}
		}, {
			sort: {
				date: -1
			},
			fields: {
				_id: 0
			}
		});

		// 要求された範囲にログがひとつもなかったら
		if (logs.length == 0) {
			// もっとも新しいログを持ってくる
			// (すくなくともひとつログが無いと隙間埋めできないため)
			const recentLog = await this.collection.findOne({
				group: group,
				span: span
			}, {
				sort: {
					date: -1
				},
				fields: {
					_id: 0
				}
			});

			if (recentLog) {
				logs = [recentLog];
			}

		// 要求された範囲の最も古い箇所に位置するログが存在しなかったら
		} else if (!utc(logs[logs.length - 1].date).isSame(gt)) {
			// 要求された範囲の最も古い箇所時点での最も新しいログを持ってきて末尾に追加する
			// (隙間埋めできないため)
			const outdatedLog = await this.collection.findOne({
				group: group,
				span: span,
				date: {
					$lt: gt.toDate()
				}
			}, {
				sort: {
					date: -1
				},
				fields: {
					_id: 0
				}
			});

			if (outdatedLog) {
				logs.push(outdatedLog);
			}
		}

		// 整形
		for (let i = (range - 1); i >= 0; i--) {
			const current =
				span == 'day' ? utc([y, m, d]).subtract(i, 'days') :
				span == 'hour' ? utc([y, m, d, h]).subtract(i, 'hours') :
				null;

			const log = logs.find(l => utc(l.date).isSame(current));

			if (log) {
				promisedChart.unshift(Promise.resolve(log.data));
			} else {
				// 隙間埋め
				const latest = logs.find(l => utc(l.date).isBefore(current));
				promisedChart.unshift(this.getTemplate(false, latest ? latest.data : null));
			}
		}

		const chart = await Promise.all(promisedChart);

		const res: ArrayValue<T> = {} as any;

		/**
		 * [{ foo: 1, bar: 5 }, { foo: 2, bar: 6 }, { foo: 3, bar: 7 }]
		 * を
		 * { foo: [1, 2, 3], bar: [5, 6, 7] }
		 * にする
		 */
		const dive = (x: Obj, path?: string) => {
			for (const [k, v] of Object.entries(x)) {
				const p = path ? `${path}.${k}` : k;
				if (typeof v == 'object') {
					dive(v, p);
				} else {
					nestedProperty.set(res, p, chart.map(s => nestedProperty.get(s, p)));
				}
			}
		};

		dive(chart[0]);

		return res;
	}
}

export function convertLog(logSchema: Schema): Schema {
	const v: Schema = JSON.parse(JSON.stringify(logSchema)); // copy
	if (v.type === 'number') {
		v.type = 'array';
		v.items = {
			type: 'number'
		};
	} else if (v.type === 'object') {
		for (const k of Object.keys(v.properties)) {
			v.properties[k] = convertLog(v.properties[k]);
		}
	}
	return v;
}

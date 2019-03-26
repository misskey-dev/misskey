/**
 * チャートエンジン
 */

// TODO: FIXME
// ログの初期挿入時に getTemplate と インクリメントコミットが行われるので
// 実際の数よりも 1 多いログが生成される
// 例えばインスタンスを作成して初めてのアカウントを作成したとき、
// 総ユーザー数が 2 になる

import * as moment from 'moment';
import * as nestedProperty from 'nested-property';
import autobind from 'autobind-decorator';
import Logger from '../logger';
import { Schema } from '../../misc/schema';
import { EntitySchema, getRepository, Repository, LessThan, MoreThanOrEqual } from 'typeorm';

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

type Log = {
	id: number;

	/**
	 * 集計のグループ
	 */
	group: string | null;

	/**
	 * 集計日時
	 */
	date: number;

	/**
	 * 集計期間
	 */
	span: Span;

	/**
	 * ユニークインクリメント用
	 */
	unique?: Record<string, any>;
};

const camelToSnake = (str: string) => {
	return str.replace(/([A-Z])/g, s => '_' + s.charAt(0).toLowerCase());
};

/**
 * 様々なチャートの管理を司るクラス
 */
export default abstract class Chart<T extends Record<string, any>> {
	public entity: any;
	protected repository: Repository<Log>;
	protected abstract async getTemplate(init: boolean, latest?: T, group?: string): Promise<T>;
	private name: string;

	private static readonly columnPrefix = '___';
	private static readonly columnDot = '_';

	@autobind
	private static convertSchemaToFlatColumnDefinitions(schema: Schema) {
		const columns = {} as any;
		const flatColumns = (x: Obj, path?: string) => {
			for (const [k, v] of Object.entries(x)) {
				const p = path ? `${path}${this.columnDot}${k}` : k;
				if (v.type === 'object') {
					flatColumns(v.properties, p);
				} else {
					columns[this.columnPrefix + p] = {
						type: 'integer',
					};
				}
			}
		};
		flatColumns(schema.properties);
		return columns;
	}

	@autobind
	private static convertFlattenColumnsToObject(x: Record<string, number>) {
		const obj = {} as any;
		for (const k of Object.keys(x).filter(k => k.startsWith(Chart.columnPrefix))) {
			// now k is ___x_y_z
			const path = k.substr(Chart.columnPrefix.length).split(Chart.columnDot).join('.');
			nestedProperty.set(obj, path, x[k]);
		}
		return obj;
	}

	@autobind
	private static convertObjectToFlattenColumns(x: Record<string, any>) {
		const columns = {} as Record<string, number>;
		const flatten = (x: Obj, path?: string) => {
			for (const [k, v] of Object.entries(x)) {
				const p = path ? `${path}${this.columnDot}${k}` : k;
				if (typeof v === 'object') {
					flatten(v, p);
				} else {
					columns[this.columnPrefix + p] = v;
				}
			}
		};
		flatten(x);
		return columns;
	}

	@autobind
	private static convertQuery(x: Record<string, any>) {
		const query: Record<string, Function> = {};

		const columns = Chart.convertObjectToFlattenColumns(x);

		for (const [k, v] of Object.entries(columns)) {
			if (v > 0) query[k] = () => `"${k}" + ${v}`;
			if (v < 0) query[k] = () => `"${k}" - ${v}`;
		}

		return query;
	}

	@autobind
	private static momentToTimestamp(x: moment.Moment): Log['date'] {
		return x.unix();
	}

	constructor(name: string, schema: Schema, grouped = false) {
		this.name = name;

		this.entity = new EntitySchema({
			name: `__chart__${camelToSnake(name)}`,
			columns: {
				id: {
					type: 'integer',
					primary: true,
					generated: true
				},
				date: {
					type: 'integer',
				},
				group: {
					type: 'varchar',
					length: 128,
					nullable: true
				},
				span: {
					type: 'enum',
					enum: ['hour', 'day']
				},
				unique: {
					type: 'jsonb',
					nullable: true
				},
				...Chart.convertSchemaToFlatColumnDefinitions(schema)
			},
		});

		const keys = ['span', 'date'];
		if (grouped) keys.push('group');

		this.entity.options.uniques = [{
			columns: keys
		}];
	}

	@autobind
	public init() {
		this.repository = getRepository<Log>(this.entity, 'charts');
		return this;
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
	private getLatestLog(span: Span, group?: string): Promise<Log> {
		return this.repository.findOne({
			group: group,
			span: span
		}, {
			order: {
				date: -1
			}
		});
	}

	@autobind
	private async getCurrentLog(span: Span, group?: string): Promise<Log> {
		const [y, m, d, h] = this.getCurrentDate();

		const current =
			span == 'day' ? utc([y, m, d]) :
			span == 'hour' ? utc([y, m, d, h]) :
			null;

		// 現在(今日または今のHour)のログ
		const currentLog = await this.repository.findOne({
			span: span,
			date: Chart.momentToTimestamp(current),
			...(group ? { group: group } : {})
		});

		// ログがあればそれを返して終了
		if (currentLog != null) {
			return currentLog;
		}

		let log: Log;
		let data: T;

		// 集計期間が変わってから、初めてのチャート更新なら
		// 最も最近のログを持ってくる
		// * 例えば集計期間が「日」である場合で考えると、
		// * 昨日何もチャートを更新するような出来事がなかった場合は、
		// * ログがそもそも作られずドキュメントが存在しないということがあり得るため、
		// * 「昨日の」と決め打ちせずに「もっとも最近の」とします
		const latest = await this.getLatestLog(span, group);

		if (latest != null) {
			const obj = Chart.convertFlattenColumnsToObject(
				latest as Record<string, any>);

			// 空ログデータを作成
			data = await this.getTemplate(false, obj);
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
			log = await this.repository.save({
				group: group,
				span: span,
				date: Chart.momentToTimestamp(current),
				...Chart.convertObjectToFlattenColumns(data)
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
	protected commit(query: Record<string, Function>, group?: string, uniqueKey?: string, uniqueValue?: string): void {
		const update = (log: Log) => {
			// ユニークインクリメントの場合、指定のキーに指定の値が既に存在していたら弾く
			if (
				uniqueKey &&
				log.unique &&
				log.unique[uniqueKey] &&
				log.unique[uniqueKey].includes(uniqueValue)
			) return;

			// ユニークインクリメントの指定のキーに値を追加
			if (uniqueKey) {
				// SEE https://stackoverflow.com/questions/42233542/appending-pushing-and-removing-from-a-json-array-in-postgresql-9-5
				const sql = `jsonb_set("unique", array['${uniqueKey}'], ("unique"->'${uniqueKey}')::jsonb || '["${uniqueValue}"]'::jsonb)`;
				query['unique'] = () => sql;
			}

			// ログ更新
			this.repository.createQueryBuilder()
				.update()
				.set(query)
				.where('id = :id', { id: log.id })
				.execute();
		};

		this.getCurrentLog('day', group).then(log => update(log));
		this.getCurrentLog('hour', group).then(log => update(log));
	}

	@autobind
	protected inc(inc: Partial<T>, group?: string): void {
		this.commit(Chart.convertQuery(inc as any), group);
	}

	@autobind
	protected incIfUnique(inc: Partial<T>, key: string, value: string, group?: string): void {
		this.commit(Chart.convertQuery(inc as any), group, key, value);
	}

	@autobind
	public async getChart(span: Span, range: number, group?: string): Promise<ArrayValue<T>> {
		const promisedChart: Promise<T>[] = [];

		const [y, m, d, h] = this.getCurrentDate();

		const gt =
			span == 'day' ? utc([y, m, d]).subtract(range, 'days') :
			span == 'hour' ? utc([y, m, d, h]).subtract(range, 'hours') :
			null;

		// ログ取得
		let logs = await this.repository.find({
			where: {
				group: group,
				span: span,
				date: MoreThanOrEqual(Chart.momentToTimestamp(gt))
			},
			order: {
				date: -1
			},
			select: ['id']
		});

		// 要求された範囲にログがひとつもなかったら
		if (logs.length == 0) {
			// もっとも新しいログを持ってくる
			// (すくなくともひとつログが無いと隙間埋めできないため)
			const recentLog = await this.repository.findOne({
				group: group,
				span: span
			}, {
				order: {
					date: -1
				},
				select: ['id']
			});

			if (recentLog) {
				logs = [recentLog];
			}

		// 要求された範囲の最も古い箇所に位置するログが存在しなかったら
		} else if (!utc(logs[logs.length - 1].date).isSame(gt)) {
			// 要求された範囲の最も古い箇所時点での最も新しいログを持ってきて末尾に追加する
			// (隙間埋めできないため)
			const outdatedLog = await this.repository.findOne({
				group: group,
				span: span,
				date: LessThan(Chart.momentToTimestamp(gt))
			}, {
				order: {
					date: -1
				},
				select: ['id']
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
			const data = Chart.convertFlattenColumnsToObject(log as Record<string, any>);

			if (log) {
				promisedChart.unshift(Promise.resolve(data));
			} else {
				// 隙間埋め
				const latest = logs.find(l => utc(l.date).isBefore(current));
				promisedChart.unshift(this.getTemplate(false, latest ? data : null));
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

/**
 * チャートエンジン
 */

import * as moment from 'moment';
import * as nestedProperty from 'nested-property';
import autobind from 'autobind-decorator';
import Logger from '../logger';
import { Schema } from '../../misc/schema';
import { EntitySchema, getRepository, Repository, LessThan, PrimaryGeneratedColumn, Column } from 'typeorm';

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

export abstract class Log {
	@PrimaryGeneratedColumn()
	public id: number;

	/**
	 * 集計のグループ
	 */
	@Column('varchar', {
		length: 128, nullable: true
	})
	public group: string | null;

	/**
	 * 集計日時
	 */
	@Column('date')
	public date: Date;

	/**
	 * 集計期間
	 */
	@Column('enum', { enum: ['day', 'hour'] })
	public span: Span;
}

/**
 * 様々なチャートの管理を司るクラス
 */
export default abstract class Chart<T extends Record<string, number>> {
	public entity: any;
	protected repository: Repository<Log>;
	protected abstract async getTemplate(init: boolean, latest?: T, group?: string): Promise<T>;
	private name: string;

	constructor(name: string, schema: Record<string, any>, grouped = false) {
		this.name = name;
		const columns = {} as any;
		const flatColumns = (x: Obj, path?: string) => {
			for (const [k, v] of Object.entries(x)) {
				const p = path ? `${path}_${k}` : k;
				if (v.type === 'object') {
					flatColumns(v.properties, p);
				} else {
					columns[p] = {
						type: 'integer',
					};
				}
			}
		};
		flatColumns(schema.properties);
		this.entity = new EntitySchema({
			name: `_chart_${name}`,
			columns: {
				id: {
					type: 'integer',
					primary: true,
					generated: true
				},
				date: {
					type: 'date',
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
				...columns
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
		this.repository = getRepository<Log>(this.entity);
		return this;
	}

	@autobind
	private convertQuery(x: Record<string, number>) {
		const query: Record<string, Function> = {};

		for (const [k, v] of Object.entries(x)) {
			if (v > 0) query[k] = () => `'${k}' + ${v}`;
			if (v < 0) query[k] = () => `'${k}' - ${v}`;
		}

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
			group: group,
			span: span,
			date: current.toDate()
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
			log = await this.repository.save({
				group: group,
				span: span,
				date: current.toDate(),
				data: data as any
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
		/*
			To increment json value in PostgreSQL:

			UPDATE table_name
			SET json_prop = jsonb_set(json_prop, '{x,y,z}', (COALESCE(json_prop->>'x,y,z', '0')::integer + 1)::text::jsonb)
			WHERE ...;

			will be
			{ x: { y: { z: 1 } } }

			SEE: https://stackoverflow.com/questions/25957937/how-to-increment-value-in-postgres-update-statement-on-json-key
		*/

		const sql = `jsonb_set(json_prop, '{x,y,z}', (COALESCE(json_prop->>'x,y,z', '0')::integer + 1)::text::jsonb)`;

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
				query['$push'] = {
					[`unique.${uniqueKey}`]: uniqueValue
				};
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
		this.commit(this.convertQuery(inc as any), group);
	}

	@autobind
	protected incIfUnique(inc: Partial<T>, key: string, value: string, group?: string): void {
		this.commit(this.convertQuery(inc as any), group, key, value);
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
				date: {
					$gte: gt.toDate()
				}
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
				date: LessThan(gt.toDate())
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

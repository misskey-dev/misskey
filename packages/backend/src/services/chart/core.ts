/**
 * チャートエンジン
 *
 * Tests located in test/chart
 */

import * as nestedProperty from 'nested-property';
import autobind from 'autobind-decorator';
import Logger from '../logger';
import { SimpleSchema } from '@/misc/simple-schema';
import { EntitySchema, getRepository, Repository, LessThan, Between } from 'typeorm';
import { dateUTC, isTimeSame, isTimeBefore, subtractTime, addTime } from '@/prelude/time';
import { getChartInsertLock } from '@/misc/app-lock';

const logger = new Logger('chart', 'white', process.env.NODE_ENV !== 'test');

export type Obj = { [key: string]: any };

export type DeepPartial<T> = {
	[P in keyof T]?: DeepPartial<T[P]>;
};

type ArrayValue<T> = {
	[P in keyof T]: T[P] extends number ? T[P][] : ArrayValue<T[P]>;
};

type Log = {
	id: number;

	/**
	 * 集計のグループ
	 */
	group?: string | null;

	/**
	 * 集計日時のUnixタイムスタンプ(秒)
	 */
	date: number;
};

const camelToSnake = (str: string): string => {
	return str.replace(/([A-Z])/g, s => '_' + s.charAt(0).toLowerCase());
};

const removeDuplicates = (array: any[]) => Array.from(new Set(array));

/**
 * 様々なチャートの管理を司るクラス
 */
// eslint-disable-next-line import/no-default-export
export default abstract class Chart<T extends Record<string, any>> {
	private static readonly columnPrefix = '___';
	private static readonly columnDot = '_';

	private name: string;
	private buffer: {
		diff: DeepPartial<T>;
		group: string | null;
	}[] = [];
	public schema: SimpleSchema;
	protected repositoryForHour: Repository<Log>;
	protected repositoryForDay: Repository<Log>;

	protected abstract genNewLog(latest: T): DeepPartial<T>;

	/**
	 * @param logs 日時が新しい方が先頭
	 */
	protected abstract aggregate(logs: T[]): T;

	protected abstract fetchActual(group: string | null): Promise<DeepPartial<T>>;

	@autobind
	private static convertSchemaToFlatColumnDefinitions(schema: SimpleSchema) {
		const columns = {} as Record<string, unknown>;
		const flatColumns = (x: Obj, path?: string) => {
			for (const [k, v] of Object.entries(x)) {
				const p = path ? `${path}${this.columnDot}${k}` : k;
				if (v.type === 'object') {
					flatColumns(v.properties, p);
				} else if (v.type === 'number') {
					columns[this.columnPrefix + p] = {
						type: 'bigint',
					};
				} else if (v.type === 'array' && v.items.type === 'string') {
					columns[this.columnPrefix + p] = {
						type: 'varchar',
						array: true,
					};
				}
			}
		};
		flatColumns(schema.properties!);
		return columns;
	}

	@autobind
	private static convertFlattenColumnsToObject(x: Record<string, unknown>): Record<string, unknown> {
		const obj = {} as Record<string, unknown>;
		for (const k of Object.keys(x).filter(k => k.startsWith(Chart.columnPrefix))) {
			// now k is ___x_y_z
			const path = k.substr(Chart.columnPrefix.length).split(Chart.columnDot).join('.');
			nestedProperty.set(obj, path, x[k]);
		}
		return obj;
	}

	@autobind
	private static convertObjectToFlattenColumns(x: Record<string, unknown>) {
		const columns = {} as Record<string, number | unknown[]>;
		const flatten = (x: Obj, path?: string) => {
			for (const [k, v] of Object.entries(x)) {
				const p = path ? `${path}${this.columnDot}${k}` : k;
				if (typeof v === 'object' && !Array.isArray(v)) {
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
	private static countUniqueFields(x: Record<string, unknown>) {
		const exec = (x: Obj) => {
			const res = {} as Record<string, unknown>;
			for (const [k, v] of Object.entries(x)) {
				if (typeof v === 'object' && !Array.isArray(v)) {
					res[k] = exec(v);
				} else if (Array.isArray(v)) {
					res[k] = Array.from(new Set(v)).length;
				} else {
					res[k] = v;
				}
			}
			return res;
		};
		return exec(x);
	}

	@autobind
	private static convertQuery(diff: Record<string, number | unknown[]>) {
		const query: Record<string, () => string> = {};

		for (const [k, v] of Object.entries(diff)) {
			if (typeof v === 'number') {
				if (v > 0) query[k] = () => `"${k}" + ${v}`;
				if (v < 0) query[k] = () => `"${k}" - ${Math.abs(v)}`;
			} else if (Array.isArray(v)) {
				// TODO: item が文字列以外の場合も対応
				// TODO: item をSQLエスケープ
				const items = v.map(item => `"${item}"`).join(',');
				query[k] = () => `array_cat("${k}", '{${items}}'::varchar[])`;
			}
		}

		return query;
	}

	@autobind
	private static dateToTimestamp(x: Date): Log['date'] {
		return Math.floor(x.getTime() / 1000);
	}

	@autobind
	private static parseDate(date: Date): [number, number, number, number, number, number, number] {
		const y = date.getUTCFullYear();
		const m = date.getUTCMonth();
		const d = date.getUTCDate();
		const h = date.getUTCHours();
		const _m = date.getUTCMinutes();
		const _s = date.getUTCSeconds();
		const _ms = date.getUTCMilliseconds();

		return [y, m, d, h, _m, _s, _ms];
	}

	@autobind
	private static getCurrentDate() {
		return Chart.parseDate(new Date());
	}

	@autobind
	public static schemaToEntity(name: string, schema: SimpleSchema, grouped = false): {
		hour: EntitySchema,
		day: EntitySchema,
	} {
		const createEntity = (span: 'hour' | 'day'): EntitySchema => new EntitySchema({
			name:
				span === 'hour' ? `__chart__${camelToSnake(name)}` :
				span === 'day' ? `__chart_day__${camelToSnake(name)}` :
				new Error('not happen') as never,
			columns: {
				id: {
					type: 'integer',
					primary: true,
					generated: true,
				},
				date: {
					type: 'integer',
				},
				...(grouped ? {
					group: {
						type: 'varchar',
						length: 128,
					},
				} : {}),
				...Chart.convertSchemaToFlatColumnDefinitions(schema),
			},
			indices: [{
				columns: grouped ? ['date', 'group'] : ['date'],
				unique: true,
			}],
			uniques: [{
				columns: grouped ? ['date', 'group'] : ['date'],
			}],
			relations: {
				/* TODO
					group: {
						target: () => Foo,
						type: 'many-to-one',
						onDelete: 'CASCADE',
					},
				*/
			},
		});

		return {
			hour: createEntity('hour'),
			day: createEntity('day'),
		};
	}

	constructor(name: string, schema: SimpleSchema, grouped = false) {
		this.name = name;
		this.schema = schema;

		const { hour, day } = Chart.schemaToEntity(name, schema, grouped);
		this.repositoryForHour = getRepository<Log>(hour);
		this.repositoryForDay = getRepository<Log>(day);
	}

	@autobind
	private getNewLog(latest: T | null): T {
		const log = latest ? this.genNewLog(latest) : {};
		const flatColumns = (x: Obj, path?: string) => {
			for (const [k, v] of Object.entries(x)) {
				const p = path ? `${path}.${k}` : k;
				if (v.type === 'object') {
					flatColumns(v.properties, p);
				} else {
					if (nestedProperty.get(log, p) == null) {
						const emptyValue = v.type === 'number' ? 0 : [];
						nestedProperty.set(log, p, emptyValue);
					}
				}
			}
		};
		flatColumns(this.schema.properties!);
		return log as T;
	}

	@autobind
	private getLatestLog(group: string | null, span: 'hour' | 'day'): Promise<Log | null> {
		const repository =
			span === 'hour' ? this.repositoryForHour :
			span === 'day' ? this.repositoryForDay :
			new Error('not happen') as never;

		return repository.findOne(group ? {
			group: group,
		} : {}, {
			order: {
				date: -1,
			},
		}).then(x => x || null);
	}

	/**
	 * 現在(=今のHour or Day)のログをデータベースから探して、あればそれを返し、なければ作成して返します。
	 */
	@autobind
	private async claimCurrentLog(group: string | null, span: 'hour' | 'day'): Promise<Log> {
		const [y, m, d, h] = Chart.getCurrentDate();

		const current = dateUTC(
			span === 'hour' ? [y, m, d, h] :
			span === 'day' ? [y, m, d] :
			new Error('not happen') as never);

		const repository =
			span === 'hour' ? this.repositoryForHour :
			span === 'day' ? this.repositoryForDay :
			new Error('not happen') as never;

		// 現在(=今のHour or Day)のログ
		const currentLog = await repository.findOne({
			date: Chart.dateToTimestamp(current),
			...(group ? { group: group } : {}),
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
		const latest = await this.getLatestLog(group, span);

		if (latest != null) {
			const obj = Chart.convertFlattenColumnsToObject(latest) as T;

			// 空ログデータを作成
			data = this.getNewLog(obj);
		} else {
			// ログが存在しなかったら
			// (Misskeyインスタンスを建てて初めてのチャート更新時など)

			// 初期ログデータを作成
			data = this.getNewLog(null);

			logger.info(`${this.name + (group ? `:${group}` : '')}(${span}): Initial commit created`);
		}

		const date = Chart.dateToTimestamp(current);
		const lockKey = group ? `${this.name}:${date}:${span}:${group}` : `${this.name}:${date}:${span}`;

		const unlock = await getChartInsertLock(lockKey);
		try {
			// ロック内でもう1回チェックする
			const currentLog = await repository.findOne({
				date: date,
				...(group ? { group: group } : {}),
			});

			// ログがあればそれを返して終了
			if (currentLog != null) return currentLog;

			// 新規ログ挿入
			log = await repository.insert({
				date: date,
				...(group ? { group: group } : {}),
				...Chart.convertObjectToFlattenColumns(data),
			}).then(x => repository.findOneOrFail(x.identifiers[0]));

			logger.info(`${this.name + (group ? `:${group}` : '')}(${span}): New commit created`);

			return log;
		} finally {
			unlock();
		}
	}

	@autobind
	protected commit(diff: DeepPartial<T>, group: string | null = null): void {
		this.buffer.push({
			diff, group,
		});
	}

	@autobind
	public async save(): Promise<void> {
		if (this.buffer.length === 0) {
			logger.info(`${this.name}: Write skipped`);
			return;
		}

		// TODO: 前の時間のログがbufferにあった場合のハンドリング
		// 例えば、save が20分ごとに行われるとして、前回行われたのは 01:50 だったとする。
		// 次に save が行われるのは 02:10 ということになるが、もし 01:55 に新規ログが buffer に追加されたとすると、
		// そのログは本来は 01:00~ のログとしてDBに保存されて欲しいのに、02:00~ のログ扱いになってしまう。
		// これを回避するための実装は複雑になりそうなため、一旦保留。

		const update = async (logHour: Log, logDay: Log): Promise<void> => {
			const finalDiffs = {} as Record<string, number | unknown[]>;

			for (const diff of this.buffer.filter(q => q.group == null || (q.group === logHour.group)).map(q => q.diff)) {
				const columns = Chart.convertObjectToFlattenColumns(diff);

				for (const [k, v] of Object.entries(columns)) {
					if (finalDiffs[k] == null) {
						finalDiffs[k] = v;
					} else {
						if (typeof finalDiffs[k] === 'number') {
							(finalDiffs[k] as number) += v as number;
						} else {
							(finalDiffs[k] as unknown[]) = (finalDiffs[k] as unknown[]).concat(v);
						}
					}
				}
			}

			const query = Chart.convertQuery(finalDiffs);

			// ログ更新
			await Promise.all([
				this.repositoryForHour.createQueryBuilder()
					.update()
					.set(query)
					.where('id = :id', { id: logHour.id })
					.execute(),
				this.repositoryForDay.createQueryBuilder()
					.update()
					.set(query)
					.where('id = :id', { id: logDay.id })
					.execute(),
			]);

			logger.info(`${this.name + (logHour.group ? `:${logHour.group}` : '')}: Updated`);

			// TODO: この一連の処理が始まった後に新たにbufferに入ったものは消さないようにする
			this.buffer = this.buffer.filter(q => q.group != null && (q.group !== logHour.group));
		};

		const groups = removeDuplicates(this.buffer.map(log => log.group));

		await Promise.all(
			groups.map(group =>
				Promise.all([
					this.claimCurrentLog(group, 'hour'),
					this.claimCurrentLog(group, 'day'),
				]).then(([logHour, logDay]) =>
					update(logHour, logDay))));
	}

	@autobind
	public async resync(group: string | null = null): Promise<void> {
		const data = await this.fetchActual(group);

		const update = async (logHour: Log, logDay: Log): Promise<void> => {
			await Promise.all([
				this.repositoryForHour.createQueryBuilder()
					.update()
					.set(Chart.convertObjectToFlattenColumns(data))
					.where('id = :id', { id: logHour.id })
					.execute(),
				this.repositoryForDay.createQueryBuilder()
					.update()
					.set(Chart.convertObjectToFlattenColumns(data))
					.where('id = :id', { id: logDay.id })
					.execute(),
			]);
		};

		return Promise.all([
			this.claimCurrentLog(group, 'hour'),
			this.claimCurrentLog(group, 'day'),
		]).then(([logHour, logDay]) =>
			update(logHour, logDay));
	}

	@autobind
	protected async inc(inc: DeepPartial<T>, group: string | null = null): Promise<void> {
		await this.commit(inc, group);
	}

	@autobind
	public async getChart(span: 'hour' | 'day', amount: number, cursor: Date | null, group: string | null = null): Promise<ArrayValue<T>> {
		const [y, m, d, h, _m, _s, _ms] = cursor ? Chart.parseDate(subtractTime(addTime(cursor, 1, span), 1)) : Chart.getCurrentDate();
		const [y2, m2, d2, h2] = cursor ? Chart.parseDate(addTime(cursor, 1, span)) : [] as never;

		const lt = dateUTC([y, m, d, h, _m, _s, _ms]);

		const gt =
			span === 'day' ? subtractTime(cursor ? dateUTC([y2, m2, d2, 0]) : dateUTC([y, m, d, 0]), amount - 1, 'day') :
			span === 'hour' ? subtractTime(cursor ? dateUTC([y2, m2, d2, h2]) : dateUTC([y, m, d, h]), amount - 1, 'hour') :
			new Error('not happen') as never;

		const repository =
			span === 'hour' ? this.repositoryForHour :
			span === 'day' ? this.repositoryForDay :
			new Error('not happen') as never;

		// ログ取得
		let logs = await repository.find({
			where: {
				date: Between(Chart.dateToTimestamp(gt), Chart.dateToTimestamp(lt)),
				...(group ? { group: group } : {}),
			},
			order: {
				date: -1,
			},
		});

		// 要求された範囲にログがひとつもなかったら
		if (logs.length === 0) {
			// もっとも新しいログを持ってくる
			// (すくなくともひとつログが無いと隙間埋めできないため)
			const recentLog = await repository.findOne(group ? {
				group: group,
			} : {}, {
				order: {
					date: -1,
				},
			});

			if (recentLog) {
				logs = [recentLog];
			}

		// 要求された範囲の最も古い箇所に位置するログが存在しなかったら
		} else if (!isTimeSame(new Date(logs[logs.length - 1].date * 1000), gt)) {
			// 要求された範囲の最も古い箇所時点での最も新しいログを持ってきて末尾に追加する
			// (隙間埋めできないため)
			const outdatedLog = await repository.findOne({
				date: LessThan(Chart.dateToTimestamp(gt)),
				...(group ? { group: group } : {}),
			}, {
				order: {
					date: -1,
				},
			});

			if (outdatedLog) {
				logs.push(outdatedLog);
			}
		}

		const chart: T[] = [];

		for (let i = (amount - 1); i >= 0; i--) {
			const current =
				span === 'hour' ? subtractTime(dateUTC([y, m, d, h]), i, 'hour') :
				span === 'day' ? subtractTime(dateUTC([y, m, d]), i, 'day') :
				new Error('not happen') as never;

			const log = logs.find(l => isTimeSame(new Date(l.date * 1000), current));

			if (log) {
				const data = Chart.convertFlattenColumnsToObject(log);
				chart.unshift(Chart.countUniqueFields(data) as T);
			} else {
				// 隙間埋め
				const latest = logs.find(l => isTimeBefore(new Date(l.date * 1000), current));
				const data = latest ? Chart.convertFlattenColumnsToObject(latest) as T : null;
				chart.unshift(Chart.countUniqueFields(this.getNewLog(data)) as T);
			}
		}

		const res = {} as Record<string, unknown>;

		/**
		 * [{ foo: 1, bar: 5 }, { foo: 2, bar: 6 }, { foo: 3, bar: 7 }]
		 * を
		 * { foo: [1, 2, 3], bar: [5, 6, 7] }
		 * にする
		 */
		const compact = (x: Obj, path?: string): void => {
			for (const [k, v] of Object.entries(x)) {
				const p = path ? `${path}.${k}` : k;
				if (typeof v === 'object' && !Array.isArray(v)) {
					compact(v, p);
				} else {
					const values = chart.map(s => nestedProperty.get(s, p));
					nestedProperty.set(res, p, values);
				}
			}
		};

		compact(chart[0]);

		return res as ArrayValue<T>;
	}
}

export function convertLog(logSchema: SimpleSchema): SimpleSchema {
	const v: SimpleSchema = JSON.parse(JSON.stringify(logSchema)); // copy
	if (v.type === 'number') {
		v.type = 'array';
		v.items = {
			type: 'number' as const,
			optional: false as const, nullable: false as const,
		};
	} else if (v.type === 'object') {
		for (const k of Object.keys(v.properties!)) {
			v.properties![k] = convertLog(v.properties![k]);
		}
	}
	return v;
}

/**
 * チャートエンジン
 *
 * Tests located in test/chart
 */

import * as nestedProperty from 'nested-property';
import autobind from 'autobind-decorator';
import Logger from '../logger';
import { EntitySchema, getRepository, Repository, LessThan, Between } from 'typeorm';
import { dateUTC, isTimeSame, isTimeBefore, subtractTime, addTime } from '@/prelude/time';
import { getChartInsertLock } from '@/misc/app-lock';

const logger = new Logger('chart', 'white', process.env.NODE_ENV !== 'test');

const columnPrefix = '___' as const;
const uniqueTempColumnPrefix = 'unique_temp___' as const;
const columnDot = '_' as const;

type KeyToColumnName<T extends string> = T extends `${infer R1}.${infer R2}` ? `${R1}${typeof columnDot}${KeyToColumnName<R2>}` : T;

type RawRecord<S extends Schema> = {
	id: number;

	/**
	 * 集計のグループ
	 */
	group?: string | null;

	/**
	 * 集計日時のUnixタイムスタンプ(秒)
	 */
	date: number;
} & {
	[K in keyof S as `${typeof uniqueTempColumnPrefix}${KeyToColumnName<string & K>}`]: S[K]['uniqueIncrement'] extends true ? string[] : never;
} & {
	[K in keyof S as `${typeof columnPrefix}${KeyToColumnName<string & K>}`]: number;
};

const camelToSnake = (str: string): string => {
	return str.replace(/([A-Z])/g, s => '_' + s.charAt(0).toLowerCase());
};

const removeDuplicates = (array: any[]) => Array.from(new Set(array));

type Schema = Record<string, {
	uniqueIncrement?: boolean;

	intersection?: string[] | ReadonlyArray<string>;

	range?: 'big' | 'small' | 'medium';

	// previousな値を引き継ぐかどうか
	accumulate?: boolean;
}>;

type Commit<S extends Schema> = {
	[K in keyof S]?: S[K]['uniqueIncrement'] extends true ? string[] : number;
};

export type KVs<S extends Schema> = {
	[K in keyof S]: number;
};

type ChartResult<T extends Schema> = {
	[P in keyof T]: number[];
};

/**
 * 様々なチャートの管理を司るクラス
 */
// eslint-disable-next-line import/no-default-export
export default abstract class Chart<T extends Schema> {
	public schema: T;

	private name: string;
	private buffer: {
		diff: Commit<T>;
		group: string | null;
	}[] = [];
	protected repositoryForHour: Repository<RawRecord<T>>;
	protected repositoryForDay: Repository<RawRecord<T>>;

	/**
	 * 1日に一回程度実行されれば良いような計算処理を入れる(主にCASCADE削除などアプリケーション側で感知できない変動によるズレの修正用)
	 */
	protected abstract tickMajor(group: string | null): Promise<Partial<KVs<T>>>;

	/**
	 * 少なくとも最小スパン内に1回は実行されて欲しい計算処理を入れる
	 */
	protected abstract tickMinor(group: string | null): Promise<Partial<KVs<T>>>;

	@autobind
	private static convertSchemaToColumnDefinitions(schema: Schema): Record<string, { type: string; array?: boolean; default?: any; }> {
		const columns = {} as Record<string, { type: string; array?: boolean; default?: any; }>;
		for (const [k, v] of Object.entries(schema)) {
			const name = k.replaceAll('.', columnDot);
			const type = v.range === 'big' ? 'bigint' : v.range === 'small' ? 'smallint' : 'integer';
			if (v.uniqueIncrement) {
				columns[uniqueTempColumnPrefix + name] = {
					type: 'varchar',
					array: true,
					default: '{}',
				};
				columns[columnPrefix + name] = {
					type,
					default: 0,
				};
			} else {
				columns[columnPrefix + name] = {
					type,
					default: 0,
				};
			}
		}
		return columns;
	}

	@autobind
	private static dateToTimestamp(x: Date): number {
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
	public static schemaToEntity(name: string, schema: Schema, grouped = false): {
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
				...Chart.convertSchemaToColumnDefinitions(schema),
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

	constructor(name: string, schema: T, grouped = false) {
		this.name = name;
		this.schema = schema;

		const { hour, day } = Chart.schemaToEntity(name, schema, grouped);
		this.repositoryForHour = getRepository<RawRecord<T>>(hour);
		this.repositoryForDay = getRepository<RawRecord<T>>(day);
	}

	@autobind
	private convertRawRecord(x: RawRecord<T>): KVs<T> {
		const kvs = {} as KVs<T>;
		for (const k of Object.keys(x).filter(k => k.startsWith(columnPrefix))) {
			kvs[k.substr(columnPrefix.length).split(columnDot).join('.')] = x[k];
		}
		return kvs;
	}

	@autobind
	private getNewLog(latest: KVs<T> | null): KVs<T> {
		const log = {} as Record<keyof T, number>;
		for (const [k, v] of Object.entries(this.schema)) {
			if (v.accumulate && latest) {
				log[k] = latest[k];
			} else {
				log[k] = 0;
			}
		}
		return log as KVs<T>;
	}

	@autobind
	private getLatestLog(group: string | null, span: 'hour' | 'day'): Promise<RawRecord<T> | null> {
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
	private async claimCurrentLog(group: string | null, span: 'hour' | 'day'): Promise<RawRecord<T>> {
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

		let log: RawRecord<T>;
		let data: KVs<T>;

		// 集計期間が変わってから、初めてのチャート更新なら
		// 最も最近のログを持ってくる
		// * 例えば集計期間が「日」である場合で考えると、
		// * 昨日何もチャートを更新するような出来事がなかった場合は、
		// * ログがそもそも作られずドキュメントが存在しないということがあり得るため、
		// * 「昨日の」と決め打ちせずに「もっとも最近の」とします
		const latest = await this.getLatestLog(group, span);

		if (latest != null) {
			// 空ログデータを作成
			data = this.getNewLog(this.convertRawRecord(latest));
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

			const columns = {} as Record<string, number | unknown[]>;
			for (const [k, v] of Object.entries(data)) {
				const name = k.replaceAll('.', columnDot);
				columns[columnPrefix + name] = v;
			}

			// 新規ログ挿入
			log = await repository.insert({
				date: date,
				...(group ? { group: group } : {}),
				...columns,
			}).then(x => repository.findOneOrFail(x.identifiers[0]));

			logger.info(`${this.name + (group ? `:${group}` : '')}(${span}): New commit created`);

			return log;
		} finally {
			unlock();
		}
	}

	@autobind
	protected commit(diff: Commit<T>, group: string | null = null): void {
		for (const [k, v] of Object.entries(diff)) {
			if (v == null || v === 0 || (Array.isArray(v) && v.length === 0)) delete diff[k];
		}
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

		const update = async (logHour: RawRecord<T>, logDay: RawRecord<T>): Promise<void> => {
			const finalDiffs = {} as Record<string, number | unknown[]>;

			for (const diff of this.buffer.filter(q => q.group == null || (q.group === logHour.group)).map(q => q.diff)) {
				for (const [k, v] of Object.entries(diff)) {
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

			const queryForHour: Record<string, number | (() => string)> = {};
			const queryForDay: Record<string, number | (() => string)> = {};
			for (const [k, v] of Object.entries(finalDiffs)) {
				if (typeof v === 'number') {
					const name = columnPrefix + k.replaceAll('.', columnDot);
					if (v > 0) queryForHour[name] = () => `"${name}" + ${v}`;
					if (v < 0) queryForHour[name] = () => `"${name}" - ${Math.abs(v)}`;
					if (v > 0) queryForDay[name] = () => `"${name}" + ${v}`;
					if (v < 0) queryForDay[name] = () => `"${name}" - ${Math.abs(v)}`;
				} else if (Array.isArray(v) && v.length > 0) { // ユニークインクリメント
					const tempColumnName = uniqueTempColumnPrefix + k.replaceAll('.', columnDot);
					// TODO: item をSQLエスケープ
					const itemsForHour = v.filter(item => !logHour[tempColumnName].includes(item)).map(item => `"${item}"`);
					const itemsForDay = v.filter(item => !logDay[tempColumnName].includes(item)).map(item => `"${item}"`);
					if (itemsForHour.length > 0) queryForHour[tempColumnName] = () => `array_cat("${tempColumnName}", '{${itemsForHour.join(',')}}'::varchar[])`;
					if (itemsForDay.length > 0) queryForDay[tempColumnName] = () => `array_cat("${tempColumnName}", '{${itemsForDay.join(',')}}'::varchar[])`;
				}
			}

			// bake unique count
			for (const [k, v] of Object.entries(finalDiffs)) {
				if (this.schema[k].uniqueIncrement) {
					const name = columnPrefix + k.replaceAll('.', columnDot);
					const tempColumnName = uniqueTempColumnPrefix + k.replaceAll('.', columnDot);
					queryForHour[name] = new Set([...v, ...logHour[tempColumnName]]).size;
					queryForDay[name] = new Set([...v, ...logDay[tempColumnName]]).size;
				}
			}

			// compute intersection
			// TODO: intersectionに指定されたカラムがintersectionだった場合の対応
			for (const [k, v] of Object.entries(this.schema)) {
				const intersection = v.intersection;
				if (intersection) {
					const name = columnPrefix + k.replaceAll('.', columnDot);
					const firstKey = intersection[0];
					const firstTempColumnName = uniqueTempColumnPrefix + firstKey.replaceAll('.', columnDot);
					const currentValuesForHour = new Set([...(finalDiffs[firstKey] ?? []), ...logHour[firstTempColumnName]]);
					const currentValuesForDay = new Set([...(finalDiffs[firstKey] ?? []), ...logDay[firstTempColumnName]]);
					for (let i = 1; i < intersection.length; i++) {
						const targetKey = intersection[i];
						const targetTempColumnName = uniqueTempColumnPrefix + targetKey.replaceAll('.', columnDot);
						const targetValuesForHour = new Set([...(finalDiffs[targetKey] ?? []), ...logHour[targetTempColumnName]]);
						const targetValuesForDay = new Set([...(finalDiffs[targetKey] ?? []), ...logDay[targetTempColumnName]]);
						currentValuesForHour.forEach(v => {
							if (!targetValuesForHour.has(v)) currentValuesForHour.delete(v);
						});
						currentValuesForDay.forEach(v => {
							if (!targetValuesForDay.has(v)) currentValuesForDay.delete(v);
						});
					}
					queryForHour[name] = currentValuesForHour.size;
					queryForDay[name] = currentValuesForDay.size;
				}
			}

			// ログ更新
			await Promise.all([
				this.repositoryForHour.createQueryBuilder()
					.update()
					.set(queryForHour)
					.where('id = :id', { id: logHour.id })
					.execute(),
				this.repositoryForDay.createQueryBuilder()
					.update()
					.set(queryForDay)
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
	public async tick(major: boolean, group: string | null = null): Promise<void> {
		const data = major ? await this.tickMajor(group) : await this.tickMinor(group);

		const columns = {} as Record<string, number>;
		for (const [k, v] of Object.entries(data)) {
			const name = k.replaceAll('.', columnDot);
			columns[columnPrefix + name] = v;
		}

		if (Object.keys(columns).length === 0) {
			return;
		}

		const update = async (logHour: RawRecord<T>, logDay: RawRecord<T>): Promise<void> => {
			await Promise.all([
				this.repositoryForHour.createQueryBuilder()
					.update()
					.set(columns as any)
					.where('id = :id', { id: logHour.id })
					.execute(),
				this.repositoryForDay.createQueryBuilder()
					.update()
					.set(columns as any)
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
	public resync(group: string | null = null): Promise<void> {
		return this.tick(true, group);
	}

	@autobind
	public async clean(): Promise<void> {
		const current = dateUTC(Chart.getCurrentDate());

		// 一日以上前かつ三日以内
		const gt = Chart.dateToTimestamp(current) - (60 * 60 * 24 * 3);
		const lt = Chart.dateToTimestamp(current) - (60 * 60 * 24);

		const columns = {} as Record<string, number>;
		for (const [k, v] of Object.entries(this.schema)) {
			if (v.uniqueIncrement) {
				const name = k.replaceAll('.', columnDot);
				columns[uniqueTempColumnPrefix + name] = [];
			}
		}

		if (Object.keys(columns).length === 0) {
			return;
		}

		await Promise.all([
			this.repositoryForHour.createQueryBuilder()
				.update()
				.set(columns as any)
				.where('date > :gt', { gt })
				.andWhere('date < :lt', { lt })
				.execute(),
			this.repositoryForDay.createQueryBuilder()
				.update()
				.set(columns as any)
				.where('date > :gt', { gt })
				.andWhere('date < :lt', { lt })
				.execute(),
		]);
	}

	@autobind
	public async getChartRaw(span: 'hour' | 'day', amount: number, cursor: Date | null, group: string | null = null): Promise<ChartResult<T>> {
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

		const chart: KVs<T>[] = [];

		for (let i = (amount - 1); i >= 0; i--) {
			const current =
				span === 'hour' ? subtractTime(dateUTC([y, m, d, h]), i, 'hour') :
				span === 'day' ? subtractTime(dateUTC([y, m, d]), i, 'day') :
				new Error('not happen') as never;

			const log = logs.find(l => isTimeSame(new Date(l.date * 1000), current));

			if (log) {
				chart.unshift(this.convertRawRecord(log));
			} else {
				// 隙間埋め
				const latest = logs.find(l => isTimeBefore(new Date(l.date * 1000), current));
				const data = latest ? this.convertRawRecord(latest) : null;
				chart.unshift(this.getNewLog(data));
			}
		}

		const res = {} as ChartResult<T>;

		/**
		 * [{ foo: 1, bar: 5 }, { foo: 2, bar: 6 }, { foo: 3, bar: 7 }]
		 * を
		 * { foo: [1, 2, 3], bar: [5, 6, 7] }
		 * にする
		 */
		for (const record of chart) {
			for (const [k, v] of Object.entries(record)) {
				if (res[k]) {
					res[k].push(v);
				} else {
					res[k] = [v];
				}
			}
		}

		return res;
	}

	@autobind
	public async getChart(span: 'hour' | 'day', amount: number, cursor: Date | null, group: string | null = null): Promise<Record<string, unknown>> {
		const result = await this.getChartRaw(span, amount, cursor, group);
		const object = {};
		for (const [k, v] of Object.entries(result)) {
			nestedProperty.set(object, k, v);
		}
		return object;
	}
}

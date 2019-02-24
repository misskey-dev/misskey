import { Context } from 'cafy';
import * as path from 'path';
import * as glob from 'glob';
import { Schema } from '../../misc/schema';

export type Param = {
	validator: Context<any>;
	transform?: any;
	default?: any;
	deprecated?: boolean;
	desc?: { [key: string]: string };
	ref?: string;
};

export interface IEndpointMeta {
	stability?: string; //'deprecated' | 'experimental' | 'stable';

	desc?: { [key: string]: string };

	tags?: string[];

	params?: {
		[key: string]: Param;
	};

	errors?: {
		[key: string]: {
			message: string;
			code: string;
			id: string;
		};
	};

	res?: Schema;

	/**
	 * このエンドポイントにリクエストするのにユーザー情報が必須か否か
	 * 省略した場合は false として解釈されます。
	 */
	requireCredential?: boolean;

	/**
	 * 管理者のみ使えるエンドポイントか否か
	 */
	requireAdmin?: boolean;

	/**
	 * 管理者またはモデレーターのみ使えるエンドポイントか否か
	 */
	requireModerator?: boolean;

	/**
	 * エンドポイントのリミテーションに関するやつ
	 * 省略した場合はリミテーションは無いものとして解釈されます。
	 * また、withCredential が false の場合はリミテーションを行うことはできません。
	 */
	limit?: {

		/**
		 * 複数のエンドポイントでリミットを共有したい場合に指定するキー
		 */
		key?: string;

		/**
		 * リミットを適用する期間(ms)
		 * このプロパティを設定する場合、max プロパティも設定する必要があります。
		 */
		duration?: number;

		/**
		 * durationで指定した期間内にいくつまでリクエストできるのか
		 * このプロパティを設定する場合、duration プロパティも設定する必要があります。
		 */
		max?: number;

		/**
		 * 最低でもどれくらいの間隔を開けてリクエストしなければならないか(ms)
		 */
		minInterval?: number;
	};

	/**
	 * ファイルの添付を必要とするか否か
	 * 省略した場合は false として解釈されます。
	 */
	requireFile?: boolean;

	/**
	 * サードパーティアプリからはリクエストすることができないか否か
	 * 省略した場合は false として解釈されます。
	 */
	secure?: boolean;

	/**
	 * エンドポイントの種類
	 * パーミッションの実現に利用されます。
	 */
	kind?: string;
}

export interface IEndpoint {
	name: string;
	exec: any;
	meta: IEndpointMeta;
}

const files = glob.sync('**/*.js', {
	cwd: path.resolve(__dirname + '/endpoints/')
});

const endpoints: IEndpoint[] = files.map(f => {
	const ep = require(`./endpoints/${f}`);

	return {
		name: f.replace('.js', ''),
		exec: ep.default,
		meta: ep.meta || {}
	};
});

export default endpoints;

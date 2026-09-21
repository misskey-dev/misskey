/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { permissions } from 'misskey-js';
import { getCastableParams } from '@/misc/schema/param-introspect.js';
import type { CastableType } from '@/misc/schema/param-introspect.js';
import type { AnyValibotSchema } from '@/misc/schema/introspect.js';
import type { PackedRolePolicies } from '@/models/schema/role.js';

import * as endpointsObject from './endpoint-list.js';

interface IEndpointMetaBase {
	readonly stability?: 'deprecated' | 'experimental' | 'stable';

	readonly tags?: ReadonlyArray<string>;

	readonly errors?: {
		readonly [key: string]: {
			readonly message: string;
			readonly code: string;
			readonly id: string;
			/**
			 * このエラーを返すときの HTTP ステータスコード (ApiError と同じ意味)。
			 * 省略した場合は 400 として返される。OpenAPI 生成でもこの値が使われる
			 */
			readonly httpStatusCode?: number;
			readonly kind?: 'client' | 'server' | 'permission';
		};
	};

	readonly res?: AnyValibotSchema;

	/**
	 * このエンドポイントにリクエストするのにユーザー情報が必須か否か
	 * 省略した場合は false として解釈されます。
	 */
	readonly requireCredential?: boolean;

	/**
	 * isModeratorなロールを必要とするか
	 */
	readonly requireModerator?: boolean;

	/**
	 * isAdministratorなロールを必要とするか
	 */
	readonly requireAdmin?: boolean;

	readonly requiredRolePolicy?: keyof PackedRolePolicies & string;

	/**
	 * 引っ越し済みのユーザーによるリクエストを禁止するか
	 * 省略した場合は false として解釈されます。
	 */
	readonly prohibitMoved?: boolean;

	/**
	 * エンドポイントのリミテーションに関するやつ
	 * 省略した場合はリミテーションは無いものとして解釈されます。
	 */
	readonly limit?: {

		/**
		 * 複数のエンドポイントでリミットを共有したい場合に指定するキー
		 */
		readonly key?: string;

		/**
		 * リミットを適用する期間(ms)
		 * このプロパティを設定する場合、max プロパティも設定する必要があります。
		 */
		readonly duration?: number;

		/**
		 * durationで指定した期間内にいくつまでリクエストできるのか
		 * このプロパティを設定する場合、duration プロパティも設定する必要があります。
		 */
		readonly max?: number;

		/**
		 * 最低でもどれくらいの間隔を開けてリクエストしなければならないか(ms)
		 */
		readonly minInterval?: number;
	};

	/**
	 * ファイルの添付を必要とするか否か
	 * 省略した場合は false として解釈されます。
	 */
	readonly requireFile?: boolean;

	/**
	 * サードパーティアプリからはリクエストすることができないか否か
	 * 省略した場合は false として解釈されます。
	 */
	readonly secure?: boolean;

	/**
	 * エンドポイントの種類
	 * パーミッションの実現に利用されます。
	 */
	readonly kind?: string;

	readonly description?: string;

	/**
	 * GETでのリクエストを許容するか否か
	 */
	readonly allowGet?: boolean;

	/**
	 * 正常応答をキャッシュ (Cache-Control: public) する秒数
	 */
	readonly cacheSec?: number;
}

export type IEndpointMeta = (Omit<IEndpointMetaBase, 'requireCrential' | 'requireModerator' | 'requireAdmin'> & {
	requireCredential?: false,
	requireAdmin?: false,
	requireModerator?: false,
}) | (Omit<IEndpointMetaBase, 'secure'> & {
	secure: true,
}) | (Omit<IEndpointMetaBase, 'requireCredential' | 'kind'> & {
	requireCredential: true,
	kind: (typeof permissions)[number],
}) | (Omit<IEndpointMetaBase, 'requireModerator' | 'kind'> & {
	requireModerator: true,
	kind: (typeof permissions)[number],
}) | (Omit<IEndpointMetaBase, 'requireAdmin' | 'kind'> & {
	requireAdmin: true,
	kind: (typeof permissions)[number],
});

export interface IEndpoint {
	name: string;
	meta: IEndpointMeta;
	params: AnyValibotSchema;
	/**
	 * GET / multipart リクエストで `JSON.parse` によるキャストが必要なトップレベルパラメータ。
	 * (paramDef の内省結果を毎リクエスト計算しないよう、初回アクセス時に 1 回だけ求めてキャッシュする)
	 */
	castableParams: Record<string, CastableType>;
}

const endpoints: IEndpoint[] = Object.entries(endpointsObject).map(([name, ep]) => {
	let castableParams: Record<string, CastableType> | null = null;

	return {
		name: name,
		get meta() {
			return ep.meta ?? {};
		},
		get params() {
			return ep.paramDef;
		},
		get castableParams() {
			if (castableParams == null) {
				castableParams = getCastableParams(ep.paramDef);
			}
			return castableParams;
		},
	};
});

// eslint-disable-next-line import/no-default-export
export default endpoints;

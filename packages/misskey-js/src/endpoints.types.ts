import type { JSONSchema7, SchemaType } from 'schema-type';
import type { References } from './schemas';
import type { endpoints } from './endpoints';
import type { DeepOmit } from 'ts-essentials';

export type RolePolicies = {
	gtlAvailable: boolean;
	ltlAvailable: boolean;
	canPublicNote: boolean;
	canInvite: boolean;
	canManageCustomEmojis: boolean;
	canSearchNotes: boolean;
	canHideAds: boolean;
	driveCapacityMb: number;
	pinLimit: number;
	antennaLimit: number;
	wordMuteLimit: number;
	webhookLimit: number;
	clipLimit: number;
	noteEachClipsLimit: number;
	userListLimit: number;
	userEachUserListsLimit: number;
	rateLimitFactor: number;
};

export type EndpointDefines = ReadonlyArray<{
	/**
	 * 要求のJSON Schema
	 * 何もないときはundefined
	 * $refは使えない(ajv由来)
	 */
	req: DeepOmit<JSONSchema7, { $ref: never }> | undefined;

	/**
	 * 応答のJSON Schema
	 * 何もないときはundefined
	 */
	res: JSONSchema7 | undefined;
}>;

/**
 * JSON Schemaのとき型に変換し、undefinedのときvoid | Record<string, never>を返す
 */
export type SchemaOrUndefined<T extends JSONSchema7 | undefined, IsResponse extends boolean = false> = T extends JSONSchema7 ? SchemaType<T, References, IsResponse> : (void | Record<string, never>);

/**
 * reqからresを推論する
 */
export type ResponseOf<D extends IEndpointMeta, P, IsResponse extends boolean = false, DD extends D['defines'][number] = D['defines'][number]> =
	P extends SchemaOrUndefined<DD['req'], IsResponse> ? SchemaOrUndefined<DD['res']> : never;

export interface IEndpointMeta {
	readonly stability?: 'deprecated' | 'experimental' | 'stable';

	readonly tags?: ReadonlyArray<string>;

	readonly errors?: {
		readonly [key: string]: {
			readonly message: string;
			readonly code: string;
			readonly id: string;
		};
	};

	readonly defines: EndpointDefines;

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

	readonly requireRolePolicy?: keyof RolePolicies;

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

export type Endpoints = typeof endpoints;

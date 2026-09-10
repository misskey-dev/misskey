/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/**
 * Misskey の paramDef / entity スキーマ (Valibot) の共通基盤。
 *
 * - {@link ./helpers.js}: Misskey 共通の DSL (`misskeyId()` / `limit()` / `maxCodePoints()` など)
 * - {@link ./metadata.js}: OpenAPI 出力用メタデータ (`format()` / `example()` / `selfRef()` など)
 * - {@link ./registry.js}: entity レジストリ (`defineEntity()` / `composeEntity()`)
 * - {@link ./introspect.js}: Valibot スキーマの内省ユーティリティ (`unwrapPipe()` / `allowsAbsent()` など)
 * - {@link ./openapi.js}: Valibot → OpenAPI (api.json) コンバータ
 * - {@link ./error.js}: `INVALID_PARAM` の info 組み立て
 * - {@link ./param-introspect.js}: paramDef の内省 (GET / multipart のキャスト対象 / `/endpoint` の型名)
 */

export {
	MISSKEY_ID_REGEX,
	CODE_POINTS_MARKER,
	UNIQUE_ITEMS_MARKER,
	countCodePoints,
	readCodePointsMarker,
	hasUniqueItemsMarker,
	misskeyId,
	integer,
	limit,
	idString,
	dateTimeString,
	urlString,
	minCodePoints,
	maxCodePoints,
	uniqueArray,
	nullableEnum,
	anyObject,
	anyRecord,
	anyArray,
	paginationEntries,
	paginationDateEntries,
} from './helpers.js';
export type { CodePointsMarker, LimitOptions } from './helpers.js';

export {
	OPENAPI_SKIP,
	schemaMeta,
	format,
	example,
	deprecated,
	selfRef,
	asOneOf,
	openApi,
	omitKeywords,
	skipInOpenApi,
	isSkippedInOpenApi,
	mergeMetadata,
} from './metadata.js';
export type { AllOfPart, EntityName, SchemaMeta, CollectedMetadata } from './metadata.js';

export {
	defineEntity,
	lookupEntityName,
	resolveEntity,
	getRegisteredEntities,
	composeEntity,
	resetEntityRegistry,
} from './registry.js';
export type { ComposedInput, ComposedOutput } from './registry.js';

export {
	isValibotSchema,
	unwrapPipe,
	baseTypeOf,
	allowsAbsent,
	resAllowsEmpty,
} from './introspect.js';
export type { AnyValibotSchema } from './introspect.js';

export { valibotToOpenApi } from './openapi.js';
export type { OpenApiSchemaObject, ValibotOpenApiContext } from './openapi.js';

export { formatValibotIssues, toInvalidParamInfo } from './error.js';
export type { InvalidParamInfo, ValibotIssueDetail } from './error.js';

export { getCastableParams, getParamTypes } from './param-introspect.js';
export type { CastableType } from './param-introspect.js';

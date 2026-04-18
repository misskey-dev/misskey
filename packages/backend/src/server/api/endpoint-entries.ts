/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as endpointsObject from './endpoint-list.js';

type EndpointModule = {
	default: object;
	meta?: unknown;
	paramDef?: unknown;
};

function isEndpointModule(endpoint: unknown): endpoint is EndpointModule {
	return endpoint != null
		&& typeof endpoint === 'object'
		&& 'default' in endpoint
		&& endpoint.default != null;
}

// Vitest can expose unresolved namespace re-exports from endpoint-list as undefined
// while loading the full endpoint graph. Keep a single normalized view here.
export const endpointEntries = Object.entries(endpointsObject).flatMap(([path, endpoint]) => {
	return isEndpointModule(endpoint) ? [[path, endpoint] as const] : [];
});

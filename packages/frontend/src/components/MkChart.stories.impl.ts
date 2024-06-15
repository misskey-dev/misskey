/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { StoryObj } from '@storybook/vue3';
import { DefaultBodyType, HttpResponse, HttpResponseResolver, JsonBodyType, PathParams, http } from 'msw';
import seedrandom from 'seedrandom';
import { action } from '@storybook/addon-actions';
import { commonHandlers } from '../../.storybook/mocks.js';
import MkChart from './MkChart.vue';

function getChartArray(seed: string, limit: number, option?: { accumulate?: boolean, mul?: number }): number[] {
	const rng = seedrandom(seed);
	const max = Math.floor(option?.mul ?? 250 * rng());
	let accumulation = 0;
	const array: number[] = [];
	for (let i = 0; i < limit; i++) {
		const num = Math.floor((max + 1) * rng());
		if (option?.accumulate) {
			accumulation += num;
			array.unshift(accumulation);
		} else {
			array.push(num);
		}
	}
	return array;
}

export function getChartResolver(fields: string[], option?: { accumulate?: boolean, mulMap?: Record<string, number> }): HttpResponseResolver<PathParams, DefaultBodyType, JsonBodyType> {
	return ({ request }) => {
		action(`GET ${request.url}`)();
		const limitParam = new URL(request.url).searchParams.get('limit');
		const limit = limitParam ? parseInt(limitParam) : 30;
		const res = {};
		for (const field of fields) {
			const layers = field.split('.');
			let current = res;
			while (layers.length > 1) {
				const currentKey = layers.shift()!;
				if (current[currentKey] == null) current[currentKey] = {};
				current = current[currentKey];
			}
			current[layers[0]] = getChartArray(field, limit, {
				accumulate: option?.accumulate,
				mul: option?.mulMap != null && field in option.mulMap ? option.mulMap[field] : undefined,
			});
		}
		return HttpResponse.json(res);
	};
}

const Base = {
	render(args) {
		return {
			components: {
				MkChart,
			},
			setup() {
				return {
					args,
				};
			},
			computed: {
				props() {
					return {
						...this.args,
					};
				},
			},
			template: '<MkChart v-bind="props" />',
		};
	},
	args: {
		src: 'federation',
		span: 'hour',
		nowForChromatic: 1716263640000,
	},
	parameters: {
		layout: 'centered',
		msw: {
			handlers: [
				...commonHandlers,
				http.get('/api/charts/federation', getChartResolver(
					['deliveredInstances', 'inboxInstances', 'stalled', 'sub', 'pub', 'pubsub', 'subActive', 'pubActive'],
				)),
				http.get('/api/charts/notes', getChartResolver(
					['local.total', 'remote.total'],
					{ accumulate: true },
				)),
				http.get('/api/charts/drive', getChartResolver(
					['local.incSize', 'local.decSize', 'remote.incSize', 'remote.decSize'],
					{ mulMap: { 'local.incSize': 1e7, 'local.decSize': 5e6, 'remote.incSize': 1e6, 'remote.decSize': 5e5 } },
				)),
			],
		},
	},
} satisfies StoryObj<typeof MkChart>;
export const FederationChart = {
	...Base,
	args: {
		...Base.args,
		src: 'federation',
	},
} satisfies StoryObj<typeof MkChart>;
export const NotesTotalChart = {
	...Base,
	args: {
		...Base.args,
		src: 'notes-total',
	},
} satisfies StoryObj<typeof MkChart>;
export const DriveChart = {
	...Base,
	args: {
		...Base.args,
		src: 'drive',
	},
} satisfies StoryObj<typeof MkChart>;

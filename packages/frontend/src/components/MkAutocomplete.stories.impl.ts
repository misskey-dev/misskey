/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { action } from '@storybook/addon-actions';
import { expect } from '@storybook/jest';
import { userEvent, waitFor, within } from '@storybook/testing-library';
import { StoryObj } from '@storybook/vue3';
import { rest } from 'msw';
import { userDetailed } from '../../.storybook/fakes';
import { commonHandlers } from '../../.storybook/mocks';
import MkAutocomplete from './MkAutocomplete.vue';
import MkInput from './MkInput.vue';
import { tick } from '@/scripts/test-utils';
const common = {
	render(args) {
		return {
			components: {
				MkAutocomplete,
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
				events() {
					return {
						open: action('open'),
						closed: action('closed'),
					};
				},
			},
			template: '<MkAutocomplete v-bind="props" v-on="events" :textarea="textarea" />',
		};
	},
	args: {
		close: action('close'),
		x: 0,
		y: 0,
	},
	decorators: [
		(_, context) => ({
			components: {
				MkInput,
			},
			data() {
				return {
					q: context.args.q,
					textarea: null,
				};
			},
			methods: {
				inputMounted() {
					this.textarea = this.$refs.input.$refs.inputEl;
				},
			},
			template: '<MkInput v-model="q" ref="input" @vue:mounted="inputMounted"/><story v-if="textarea" :q="q" :textarea="textarea"/>',
		}),
	],
	parameters: {
		controls: {
			exclude: ['textarea'],
		},
		layout: 'centered',
		chromatic: {
			// FIXME: flaky
			disableSnapshot: true,
		},
	},
} satisfies StoryObj<typeof MkAutocomplete>;
export const User = {
	...common,
	args: {
		...common.args,
		type: 'user',
	},
	async play({ canvasElement }) {
		const canvas = within(canvasElement);
		const input = canvas.getByRole('combobox');
		await waitFor(() => userEvent.hover(input));
		await waitFor(() => userEvent.click(input));
		await waitFor(() => userEvent.type(input, 'm'));
		await waitFor(async () => {
			await userEvent.type(input, ' ', { delay: 256 });
			await tick();
			return await expect(canvas.getByRole('list')).toBeInTheDocument();
		}, { timeout: 16384 });
	},
	parameters: {
		...common.parameters,
		msw: {
			handlers: [
				...commonHandlers,
				rest.post('/api/users/search-by-username-and-host', (req, res, ctx) => {
					return res(ctx.json([
						userDetailed('44', 'mizuki', 'misskey-hub.net', 'Mizuki'),
						userDetailed('49', 'momoko', 'misskey-hub.net', 'Momoko'),
					]));
				}),
			],
		},
	},
};
export const Hashtag = {
	...common,
	args: {
		...common.args,
		type: 'hashtag',
	},
	async play({ canvasElement }) {
		const canvas = within(canvasElement);
		const input = canvas.getByRole('combobox');
		await waitFor(() => userEvent.hover(input));
		await waitFor(() => userEvent.click(input));
		await waitFor(() => userEvent.type(input, '気象'));
		await waitFor(async () => {
			await userEvent.type(input, ' ', { delay: 256 });
			await tick();
			return await expect(canvas.getByRole('list')).toBeInTheDocument();
		}, { interval: 256, timeout: 16384 });
	},
	parameters: {
		...common.parameters,
		msw: {
			handlers: [
				...commonHandlers,
				rest.post('/api/hashtags/search', (req, res, ctx) => {
					return res(ctx.json([
						'気象警報注意報',
						'気象警報',
						'気象情報',
					]));
				}),
			],
		},
	},
};
export const Emoji = {
	...common,
	args: {
		...common.args,
		type: 'emoji',
	},
	async play({ canvasElement }) {
		const canvas = within(canvasElement);
		const input = canvas.getByRole('combobox');
		await waitFor(() => userEvent.hover(input));
		await waitFor(() => userEvent.click(input));
		await waitFor(() => userEvent.type(input, 'smile'));
		await waitFor(async () => {
			await userEvent.type(input, ' ', { delay: 256 });
			await tick();
			return await expect(canvas.getByRole('list')).toBeInTheDocument();
		}, { interval: 256, timeout: 16384 });
	},
} satisfies StoryObj<typeof MkAutocomplete>;
export const MfmTag = {
	...common,
	args: {
		...common.args,
		type: 'mfmTag',
	},
	async play({ canvasElement }) {
		const canvas = within(canvasElement);
		const input = canvas.getByRole('combobox');
		await waitFor(() => userEvent.hover(input));
		await waitFor(() => userEvent.click(input));
		await waitFor(async () => {
			await tick();
			return await expect(canvas.getByRole('list')).toBeInTheDocument();
		}, { interval: 256, timeout: 16384 });
	},
} satisfies StoryObj<typeof MkAutocomplete>;

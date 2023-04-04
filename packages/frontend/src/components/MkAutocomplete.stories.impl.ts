/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { action } from '@storybook/addon-actions';
import { StoryObj } from '@storybook/vue3';
import { rest } from 'msw';
import { userDetailed } from '../../.storybook/fakes';
import { commonHandlers } from '../../.storybook/mocks';
import MkAutocomplete from './MkAutocomplete.vue';
import MkInput from './MkInput.vue';
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
	},
} satisfies StoryObj<typeof MkAutocomplete>;
export const User = {
	...common,
	args: {
		...common.args,
		type: 'user',
		q: 'm',
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
		q: '気象',
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
		q: 'smile',
	},
} satisfies StoryObj<typeof MkAutocomplete>;
export const MfmTag = {
	...common,
	args: {
		...common.args,
		type: 'mfmTag',
	},
} satisfies StoryObj<typeof MkAutocomplete>;

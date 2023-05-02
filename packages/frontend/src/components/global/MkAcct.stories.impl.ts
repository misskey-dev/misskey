/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { StoryObj } from '@storybook/vue3';
import { userDetailed } from '../../../.storybook/fakes';
import MkAcct from './MkAcct.vue';
export const Default = {
	render(args) {
		return {
			components: {
				MkAcct,
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
			template: '<MkAcct v-bind="props" />',
		};
	},
	args: {
		user: {
			...userDetailed(),
			host: null,
		},
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkAcct>;
export const Detail = {
	...Default,
	args: {
		...Default.args,
		user: userDetailed(),
		detail: true,
	},
} satisfies StoryObj<typeof MkAcct>;
export const Long = {
	...Default,
	args: {
		...Default.args,
		user: {
			...userDetailed(),
			username: '2c7cc62a697ea3a7826521f3fd34f0cb273693cbe5e9310f35449f43622a5cdc',
			host: 'nostr.example',
		},
	},
	decorators: [
		() => ({
			template: '<div style="width: 360px;"><story/></div>',
		}),
	],
} satisfies StoryObj<typeof MkAcct>;

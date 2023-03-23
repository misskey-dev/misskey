/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import proxy_account from './proxy-account.vue';
const meta = {
	title: 'pages/admin/proxy-account',
	component: proxy_account,
} satisfies Meta<typeof proxy_account>;
export const Default = {
	render(args) {
		return {
			components: {
				proxy_account,
			},
			setup() {
				return {
					args,
				};
			},
			computed: {
				props() {
					return {
						...args,
					};
				},
			},
			template: '<proxy_account v-bind="props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof proxy_account>;
export default meta;

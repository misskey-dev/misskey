/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import account_info from './account-info.vue';
const meta = {
	title: 'pages/settings/account-info',
	component: account_info,
} satisfies Meta<typeof account_info>;
export const Default = {
	render(args) {
		return {
			components: {
				account_info,
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
			template: '<account_info v-bind="props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof account_info>;
export default meta;

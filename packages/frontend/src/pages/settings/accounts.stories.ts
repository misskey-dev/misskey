/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import accounts_ from './accounts.vue';
const meta = {
	title: 'pages/settings/accounts',
	component: accounts_,
} satisfies Meta<typeof accounts_>;
export const Default = {
	render(args) {
		return {
			components: {
				accounts_,
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
			template: '<accounts_ v-bind="props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof accounts_>;
export default meta;

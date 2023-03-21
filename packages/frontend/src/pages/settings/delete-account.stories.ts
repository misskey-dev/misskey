/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import delete_account from './delete-account.vue';
const meta = {
	title: 'pages/settings/delete-account',
	component: delete_account,
} satisfies Meta<typeof delete_account>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				delete_account,
			},
			props: Object.keys(argTypes),
			template: '<delete_account v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof delete_account>;
export default meta;

/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import statusbar_user_list from './statusbar-user-list.vue';
const meta = {
	title: 'ui/_common_/statusbar-user-list',
	component: statusbar_user_list,
} satisfies Meta<typeof statusbar_user_list>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				statusbar_user_list,
			},
			props: Object.keys(argTypes),
			template: '<statusbar_user_list v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof statusbar_user_list>;
export default meta;

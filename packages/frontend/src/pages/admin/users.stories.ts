/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import users_ from './users.vue';
const meta = {
	title: 'pages/admin/users',
	component: users_,
} satisfies Meta<typeof users_>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				users_,
			},
			props: Object.keys(argTypes),
			template: '<users_ v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof users_>;
export default meta;

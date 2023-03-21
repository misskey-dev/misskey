/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import explore_users from './explore.users.vue';
const meta = {
	title: 'pages/explore.users',
	component: explore_users,
} satisfies Meta<typeof explore_users>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				explore_users,
			},
			props: Object.keys(argTypes),
			template: '<explore_users v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof explore_users>;
export default meta;

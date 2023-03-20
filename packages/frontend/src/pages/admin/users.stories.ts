import { Meta, StoryObj } from '@storybook/vue3';
import users from './users.vue';
const meta = {
	title: 'pages/admin/users',
	component: users,
} satisfies Meta<typeof users>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				users,
			},
			props: Object.keys(argTypes),
			template: '<users v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof users>;
export default meta;

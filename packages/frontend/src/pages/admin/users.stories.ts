import { Meta, Story } from '@storybook/vue3';
import users from './users.vue';
const meta = {
	title: 'pages/admin/users',
	component: users,
};
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
};
export default meta;

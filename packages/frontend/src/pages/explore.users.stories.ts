import { Meta, Story } from '@storybook/vue3';
import explore_users from './explore.users.vue';
const meta = {
	title: 'pages/explore.users',
	component: explore_users,
};
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
};
export default meta;

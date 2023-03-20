import { Meta, Story } from '@storybook/vue3';
import overview_users from './overview.users.vue';
const meta = {
	title: 'pages/admin/overview.users',
	component: overview_users,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				overview_users,
			},
			props: Object.keys(argTypes),
			template: '<overview_users v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
};
export default meta;

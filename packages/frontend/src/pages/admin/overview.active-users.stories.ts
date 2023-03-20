import { Meta, Story } from '@storybook/vue3';
import overview_active_users from './overview.active-users.vue';
const meta = {
	title: 'pages/admin/overview.active-users',
	component: overview_active_users,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				overview_active_users,
			},
			props: Object.keys(argTypes),
			template: '<overview_active_users v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
};
export default meta;

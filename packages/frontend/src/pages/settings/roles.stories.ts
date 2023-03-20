import { Meta, Story } from '@storybook/vue3';
import roles from './roles.vue';
const meta = {
	title: 'pages/settings/roles',
	component: roles,
};
export const Default = {
	components: {
		roles,
	},
	template: '<roles />',
	parameters: {
		layout: 'fullscreen',
	},
};
export default meta;

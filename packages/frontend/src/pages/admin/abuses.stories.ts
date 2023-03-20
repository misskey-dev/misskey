import { Meta, Story } from '@storybook/vue3';
import abuses from './abuses.vue';
const meta = {
	title: 'pages/admin/abuses',
	component: abuses,
};
export const Default = {
	components: {
		abuses,
	},
	template: '<abuses />',
	parameters: {
		layout: 'fullscreen',
	},
};
export default meta;

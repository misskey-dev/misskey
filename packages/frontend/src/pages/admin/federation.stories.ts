import { Meta, Story } from '@storybook/vue3';
import federation from './federation.vue';
const meta = {
	title: 'pages/admin/federation',
	component: federation,
};
export const Default = {
	components: {
		federation,
	},
	template: '<federation />',
	parameters: {
		layout: 'fullscreen',
	},
};
export default meta;

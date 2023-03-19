import { Meta, Story } from '@storybook/vue3';
import custom_css from './custom-css.vue';
const meta = {
	title: 'pages/settings/custom-css',
	component: custom_css,
};
export const Default = {
	components: {
		custom_css,
	},
	template: '<custom-css />',
};
export default meta;

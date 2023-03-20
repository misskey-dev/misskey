import { Meta, Story } from '@storybook/vue3';
import about from './about.vue';
const meta = {
	title: 'pages/about',
	component: about,
};
export const Default = {
	components: {
		about,
	},
	template: '<about />',
	parameters: {
		layout: 'fullscreen',
	},
};
export default meta;

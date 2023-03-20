import { Meta, Story } from '@storybook/vue3';
import gallery from './gallery.vue';
const meta = {
	title: 'pages/user/gallery',
	component: gallery,
};
export const Default = {
	components: {
		gallery,
	},
	template: '<gallery />',
	parameters: {
		layout: 'fullscreen',
	},
};
export default meta;

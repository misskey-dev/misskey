import { Meta, Story } from '@storybook/vue3';
import drive from './drive.vue';
const meta = {
	title: 'pages/drive',
	component: drive,
};
export const Default = {
	components: {
		drive,
	},
	template: '<drive />',
	parameters: {
		layout: 'fullscreen',
	},
};
export default meta;

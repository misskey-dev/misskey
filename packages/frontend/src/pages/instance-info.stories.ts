import { Meta, Story } from '@storybook/vue3';
import instance_info from './instance-info.vue';
const meta = {
	title: 'pages/instance-info',
	component: instance_info,
};
export const Default = {
	components: {
		instance_info,
	},
	template: '<instance_info />',
	parameters: {
		layout: 'fullscreen',
	},
};
export default meta;

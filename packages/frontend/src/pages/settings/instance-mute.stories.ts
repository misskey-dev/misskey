import { Meta, Story } from '@storybook/vue3';
import instance_mute from './instance-mute.vue';
const meta = {
	title: 'pages/settings/instance-mute',
	component: instance_mute,
};
export const Default = {
	components: {
		instance_mute,
	},
	template: '<instance_mute />',
	parameters: {
		layout: 'fullscreen',
	},
};
export default meta;

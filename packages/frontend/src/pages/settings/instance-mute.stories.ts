import { Meta, Story } from '@storybook/vue3';
import instance_mute from './instance-mute.vue';
const meta = {
	title: 'pages/settings/instance-mute',
	component: instance_mute,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				instance_mute,
			},
			props: Object.keys(argTypes),
			template: '<instance_mute v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
};
export default meta;

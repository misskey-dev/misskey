import { Meta, Story } from '@storybook/vue3';
import instance_info from './instance-info.vue';
const meta = {
	title: 'pages/instance-info',
	component: instance_info,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				instance_info,
			},
			props: Object.keys(argTypes),
			template: '<instance_info v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
};
export default meta;

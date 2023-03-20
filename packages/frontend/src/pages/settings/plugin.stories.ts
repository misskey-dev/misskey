import { Meta, Story } from '@storybook/vue3';
import plugin from './plugin.vue';
const meta = {
	title: 'pages/settings/plugin',
	component: plugin,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				plugin,
			},
			props: Object.keys(argTypes),
			template: '<plugin v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
};
export default meta;

import { Meta, Story } from '@storybook/vue3';
import plugin_install from './plugin.install.vue';
const meta = {
	title: 'pages/settings/plugin.install',
	component: plugin_install,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				plugin_install,
			},
			props: Object.keys(argTypes),
			template: '<plugin_install v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
};
export default meta;

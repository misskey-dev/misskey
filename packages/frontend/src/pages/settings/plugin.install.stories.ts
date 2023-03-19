import { Meta, Story } from '@storybook/vue3';
import plugin_install from './plugin.install.vue';
const meta = {
	title: 'pages/settings/plugin.install',
	component: plugin_install,
};
export const Default = {
	components: {
		plugin_install,
	},
	template: '<plugin.install />',
};
export default meta;

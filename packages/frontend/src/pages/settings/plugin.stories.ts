import { Meta, Story } from '@storybook/vue3';
import plugin from './plugin.vue';
const meta = {
	title: 'pages/settings/plugin',
	component: plugin,
};
export const Default = {
	components: {
		plugin,
	},
	template: '<plugin />',
};
export default meta;

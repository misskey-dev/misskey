import { Meta, Story } from '@storybook/vue3';
import apps from './apps.vue';
const meta = {
	title: 'pages/settings/apps',
	component: apps,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				apps,
			},
			props: Object.keys(argTypes),
			template: '<apps v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
};
export default meta;

import { Meta, Story } from '@storybook/vue3';
import other_settings from './other-settings.vue';
const meta = {
	title: 'pages/admin/other-settings',
	component: other_settings,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				other_settings,
			},
			props: Object.keys(argTypes),
			template: '<other_settings v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
};
export default meta;

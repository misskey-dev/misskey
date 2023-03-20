import { Meta, Story } from '@storybook/vue3';
import api from './api.vue';
const meta = {
	title: 'pages/settings/api',
	component: api,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				api,
			},
			props: Object.keys(argTypes),
			template: '<api v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
};
export default meta;

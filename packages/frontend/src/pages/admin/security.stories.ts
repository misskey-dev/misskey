import { Meta, Story } from '@storybook/vue3';
import security from './security.vue';
const meta = {
	title: 'pages/admin/security',
	component: security,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				security,
			},
			props: Object.keys(argTypes),
			template: '<security v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
};
export default meta;

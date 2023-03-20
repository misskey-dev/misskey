import { Meta, Story } from '@storybook/vue3';
import moderation from './moderation.vue';
const meta = {
	title: 'pages/admin/moderation',
	component: moderation,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				moderation,
			},
			props: Object.keys(argTypes),
			template: '<moderation v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
};
export default meta;

import { Meta, Story } from '@storybook/vue3';
import general from './general.vue';
const meta = {
	title: 'pages/settings/general',
	component: general,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				general,
			},
			props: Object.keys(argTypes),
			template: '<general v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
};
export default meta;

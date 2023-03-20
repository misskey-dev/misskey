import { Meta, Story } from '@storybook/vue3';
import theme from './theme.vue';
const meta = {
	title: 'pages/settings/theme',
	component: theme,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				theme,
			},
			props: Object.keys(argTypes),
			template: '<theme v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
};
export default meta;

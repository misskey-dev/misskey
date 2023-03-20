import { Meta, Story } from '@storybook/vue3';
import theme_manage from './theme.manage.vue';
const meta = {
	title: 'pages/settings/theme.manage',
	component: theme_manage,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				theme_manage,
			},
			props: Object.keys(argTypes),
			template: '<theme_manage v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
};
export default meta;

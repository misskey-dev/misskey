import { Meta, Story } from '@storybook/vue3';
import theme_install from './theme.install.vue';
const meta = {
	title: 'pages/settings/theme.install',
	component: theme_install,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				theme_install,
			},
			props: Object.keys(argTypes),
			template: '<theme_install v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
};
export default meta;

import { Meta, Story } from '@storybook/vue3';
import theme_install from './theme.install.vue';
const meta = {
	title: 'pages/settings/theme.install',
	component: theme_install,
};
export const Default = {
	components: {
		theme_install,
	},
	template: '<theme.install />',
};
export default meta;

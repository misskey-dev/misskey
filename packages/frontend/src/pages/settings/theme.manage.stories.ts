import { Meta, Story } from '@storybook/vue3';
import theme_manage from './theme.manage.vue';
const meta = {
	title: 'pages/settings/theme.manage',
	component: theme_manage,
};
export const Default = {
	components: {
		theme_manage,
	},
	template: '<theme_manage />',
};
export default meta;

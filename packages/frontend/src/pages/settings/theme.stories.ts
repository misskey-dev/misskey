import { Meta, Story } from '@storybook/vue3';
import theme from './theme.vue';
const meta = {
	title: 'pages/settings/theme',
	component: theme,
};
export const Default = {
	components: {
		theme,
	},
	template: '<theme />',
};
export default meta;

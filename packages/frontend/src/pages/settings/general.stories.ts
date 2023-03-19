import { Meta, Story } from '@storybook/vue3';
import general from './general.vue';
const meta = {
	title: 'pages/settings/general',
	component: general,
};
export const Default = {
	components: {
		general,
	},
	template: '<general />',
};
export default meta;

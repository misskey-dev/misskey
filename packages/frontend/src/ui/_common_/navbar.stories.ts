import { Meta, Story } from '@storybook/vue3';
import navbar from './navbar.vue';
const meta = {
	title: 'ui/_common_/navbar',
	component: navbar,
};
export const Default = {
	components: {
		navbar,
	},
	template: '<navbar />',
};
export default meta;

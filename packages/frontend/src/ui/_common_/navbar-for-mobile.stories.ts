import { Meta, Story } from '@storybook/vue3';
import navbar_for_mobile from './navbar-for-mobile.vue';
const meta = {
	title: 'ui/_common_/navbar-for-mobile',
	component: navbar_for_mobile,
};
export const Default = {
	components: {
		navbar_for_mobile,
	},
	template: '<navbar_for_mobile />',
};
export default meta;

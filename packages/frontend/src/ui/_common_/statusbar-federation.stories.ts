import { Meta, Story } from '@storybook/vue3';
import statusbar_federation from './statusbar-federation.vue';
const meta = {
	title: 'ui/_common_/statusbar-federation',
	component: statusbar_federation,
};
export const Default = {
	components: {
		statusbar_federation,
	},
	template: '<statusbar_federation />',
	parameters: {
		layout: 'centered',
	},
};
export default meta;

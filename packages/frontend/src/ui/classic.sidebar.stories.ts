import { Meta, Story } from '@storybook/vue3';
import classic_sidebar from './classic.sidebar.vue';
const meta = {
	title: 'ui/classic.sidebar',
	component: classic_sidebar,
};
export const Default = {
	components: {
		classic_sidebar,
	},
	template: '<classic_sidebar />',
	parameters: {
		layout: 'centered',
	},
};
export default meta;

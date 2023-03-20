import { Meta, Story } from '@storybook/vue3';
import classic from './classic.vue';
const meta = {
	title: 'ui/classic',
	component: classic,
};
export const Default = {
	components: {
		classic,
	},
	template: '<classic />',
	parameters: {
		layout: 'centered',
	},
};
export default meta;

import { Meta, Story } from '@storybook/vue3';
import a from './a.vue';
const meta = {
	title: 'ui/visitor/a',
	component: a,
};
export const Default = {
	components: {
		a,
	},
	template: '<a />',
	parameters: {
		layout: 'centered',
	},
};
export default meta;

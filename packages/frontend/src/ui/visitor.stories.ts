import { Meta, Story } from '@storybook/vue3';
import visitor from './visitor.vue';
const meta = {
	title: 'ui/visitor',
	component: visitor,
};
export const Default = {
	components: {
		visitor,
	},
	template: '<visitor />',
	parameters: {
		layout: 'centered',
	},
};
export default meta;

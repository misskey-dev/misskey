import { Meta, Story } from '@storybook/vue3';
import b from './b.vue';
const meta = {
	title: 'ui/visitor/b',
	component: b,
};
export const Default = {
	components: {
		b,
	},
	template: '<b />',
};
export default meta;

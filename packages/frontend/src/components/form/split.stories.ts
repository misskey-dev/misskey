import { Meta, Story } from '@storybook/vue3';
import split from './split.vue';
const meta = {
	title: 'components/form/split',
	component: split,
};
export const Default = {
	components: {
		split,
	},
	template: '<split />',
	parameters: {
		layout: 'centered',
	},
};
export default meta;

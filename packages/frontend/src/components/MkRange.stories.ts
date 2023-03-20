import { Meta, Story } from '@storybook/vue3';
import MkRange from './MkRange.vue';
const meta = {
	title: 'components/MkRange',
	component: MkRange,
};
export const Default = {
	components: {
		MkRange,
	},
	template: '<MkRange />',
	parameters: {
		layout: 'centered',
	},
};
export default meta;

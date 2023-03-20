import { Meta, Story } from '@storybook/vue3';
import MkA from './MkA.vue';
const meta = {
	title: 'components/global/MkA',
	component: MkA,
};
export const Default = {
	components: {
		MkA,
	},
	template: '<MkA />',
	parameters: {
		layout: 'centered',
	},
};
export default meta;

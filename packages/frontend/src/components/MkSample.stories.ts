import { Meta, Story } from '@storybook/vue3';
import MkSample from './MkSample.vue';
const meta = {
	title: 'components/MkSample',
	component: MkSample,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkSample,
			},
			props: Object.keys(argTypes),
			template: '<MkSample v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
};
export default meta;

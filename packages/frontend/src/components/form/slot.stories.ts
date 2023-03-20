import { Meta, Story } from '@storybook/vue3';
import slot from './slot.vue';
const meta = {
	title: 'components/form/slot',
	component: slot,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				slot,
			},
			props: Object.keys(argTypes),
			template: '<slot v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
};
export default meta;

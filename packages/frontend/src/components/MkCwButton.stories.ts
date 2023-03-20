import { Meta, Story } from '@storybook/vue3';
import MkCwButton from './MkCwButton.vue';
const meta = {
	title: 'components/MkCwButton',
	component: MkCwButton,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkCwButton,
			},
			props: Object.keys(argTypes),
			template: '<MkCwButton v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
};
export default meta;

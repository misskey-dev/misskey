import { Meta, Story } from '@storybook/vue3';
import MkCheckbox from './MkCheckbox.vue';
const meta = {
	title: 'components/MkCheckbox',
	component: MkCheckbox,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkCheckbox,
			},
			props: Object.keys(argTypes),
			template: '<MkCheckbox v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
};
export default meta;

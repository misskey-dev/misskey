import { Meta, Story } from '@storybook/vue3';
import MkKeyValue from './MkKeyValue.vue';
const meta = {
	title: 'components/MkKeyValue',
	component: MkKeyValue,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkKeyValue,
			},
			props: Object.keys(argTypes),
			template: '<MkKeyValue v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
};
export default meta;

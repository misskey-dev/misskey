import { Meta, Story } from '@storybook/vue3';
import MkInput from './MkInput.vue';
const meta = {
	title: 'components/MkInput',
	component: MkInput,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkInput,
			},
			props: Object.keys(argTypes),
			template: '<MkInput v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
};
export default meta;

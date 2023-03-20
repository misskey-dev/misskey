import { Meta, Story } from '@storybook/vue3';
import MkError from './MkError.vue';
const meta = {
	title: 'components/global/MkError',
	component: MkError,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkError,
			},
			props: Object.keys(argTypes),
			template: '<MkError v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
};
export default meta;

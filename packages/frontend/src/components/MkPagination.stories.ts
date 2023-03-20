import { Meta, Story } from '@storybook/vue3';
import MkPagination from './MkPagination.vue';
const meta = {
	title: 'components/MkPagination',
	component: MkPagination,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkPagination,
			},
			props: Object.keys(argTypes),
			template: '<MkPagination v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
};
export default meta;

import { Meta, Story } from '@storybook/vue3';
import MkLoading from './MkLoading.vue';
const meta = {
	title: 'components/global/MkLoading',
	component: MkLoading,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkLoading,
			},
			props: Object.keys(argTypes),
			template: '<MkLoading v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
};
export default meta;

import { Meta, Story } from '@storybook/vue3';
import MkDateSeparatedList from './MkDateSeparatedList.vue';
const meta = {
	title: 'components/MkDateSeparatedList',
	component: MkDateSeparatedList,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkDateSeparatedList,
			},
			props: Object.keys(argTypes),
			template: '<MkDateSeparatedList v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
};
export default meta;

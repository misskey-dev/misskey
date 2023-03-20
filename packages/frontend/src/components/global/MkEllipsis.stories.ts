import { Meta, Story } from '@storybook/vue3';
import MkEllipsis from './MkEllipsis.vue';
const meta = {
	title: 'components/global/MkEllipsis',
	component: MkEllipsis,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkEllipsis,
			},
			props: Object.keys(argTypes),
			template: '<MkEllipsis v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
};
export default meta;

import { Meta, Story } from '@storybook/vue3';
import MkTime from './MkTime.vue';
const meta = {
	title: 'components/global/MkTime',
	component: MkTime,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkTime,
			},
			props: Object.keys(argTypes),
			template: '<MkTime v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
};
export default meta;

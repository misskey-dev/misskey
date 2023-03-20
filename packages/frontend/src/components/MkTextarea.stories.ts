import { Meta, Story } from '@storybook/vue3';
import MkTextarea from './MkTextarea.vue';
const meta = {
	title: 'components/MkTextarea',
	component: MkTextarea,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkTextarea,
			},
			props: Object.keys(argTypes),
			template: '<MkTextarea v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
};
export default meta;

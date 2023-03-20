import { Meta, Story } from '@storybook/vue3';
import MkModalWindow from './MkModalWindow.vue';
const meta = {
	title: 'components/MkModalWindow',
	component: MkModalWindow,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkModalWindow,
			},
			props: Object.keys(argTypes),
			template: '<MkModalWindow v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
};
export default meta;

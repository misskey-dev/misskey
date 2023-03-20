import { Meta, Story } from '@storybook/vue3';
import MkPageWindow from './MkPageWindow.vue';
const meta = {
	title: 'components/MkPageWindow',
	component: MkPageWindow,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkPageWindow,
			},
			props: Object.keys(argTypes),
			template: '<MkPageWindow v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
};
export default meta;

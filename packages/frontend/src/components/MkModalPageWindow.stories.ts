import { Meta, Story } from '@storybook/vue3';
import MkModalPageWindow from './MkModalPageWindow.vue';
const meta = {
	title: 'components/MkModalPageWindow',
	component: MkModalPageWindow,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkModalPageWindow,
			},
			props: Object.keys(argTypes),
			template: '<MkModalPageWindow v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
};
export default meta;

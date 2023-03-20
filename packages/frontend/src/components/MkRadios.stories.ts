import { Meta, Story } from '@storybook/vue3';
import MkRadios from './MkRadios.vue';
const meta = {
	title: 'components/MkRadios',
	component: MkRadios,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkRadios,
			},
			props: Object.keys(argTypes),
			template: '<MkRadios v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
};
export default meta;

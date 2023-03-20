import { Meta, Story } from '@storybook/vue3';
import MkRadio from './MkRadio.vue';
const meta = {
	title: 'components/MkRadio',
	component: MkRadio,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkRadio,
			},
			props: Object.keys(argTypes),
			template: '<MkRadio v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
};
export default meta;

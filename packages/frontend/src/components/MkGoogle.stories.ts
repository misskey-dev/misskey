import { Meta, Story } from '@storybook/vue3';
import MkGoogle from './MkGoogle.vue';
const meta = {
	title: 'components/MkGoogle',
	component: MkGoogle,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkGoogle,
			},
			props: Object.keys(argTypes),
			template: '<MkGoogle v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
};
export default meta;

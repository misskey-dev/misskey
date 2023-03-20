import { Meta, Story } from '@storybook/vue3';
import MkLaunchPad from './MkLaunchPad.vue';
const meta = {
	title: 'components/MkLaunchPad',
	component: MkLaunchPad,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkLaunchPad,
			},
			props: Object.keys(argTypes),
			template: '<MkLaunchPad v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
};
export default meta;

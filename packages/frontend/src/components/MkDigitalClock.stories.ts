import { Meta, Story } from '@storybook/vue3';
import MkDigitalClock from './MkDigitalClock.vue';
const meta = {
	title: 'components/MkDigitalClock',
	component: MkDigitalClock,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkDigitalClock,
			},
			props: Object.keys(argTypes),
			template: '<MkDigitalClock v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
};
export default meta;

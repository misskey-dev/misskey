import { Meta, Story } from '@storybook/vue3';
const meta = {
	title: 'components/MkAnalogClock',
	component: MkAnalogClock,
};
export default meta;
import MkAnalogClock from './MkAnalogClock.vue';
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkAnalogClock,
			},
			props: Object.keys(argTypes),
			template: '<MkAnalogClock v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
};

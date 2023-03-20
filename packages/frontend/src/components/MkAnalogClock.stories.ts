import { Meta, Story } from '@storybook/vue3';
import MkAnalogClock from './MkAnalogClock.vue';
const meta = {
	title: 'components/MkAnalogClock',
	component: MkAnalogClock,
};
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
export default meta;

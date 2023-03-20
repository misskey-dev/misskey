import { Meta, Story } from '@storybook/vue3';
import MkAnalogClock from './MkAnalogClock.vue';
const meta = {
	title: 'components/MkAnalogClock',
	component: MkAnalogClock,
};
export const Default = {
	components: {
		MkAnalogClock,
	},
	template: '<MkAnalogClock />',
	parameters: {
		layout: 'fullscreen',
	},
};
export default meta;

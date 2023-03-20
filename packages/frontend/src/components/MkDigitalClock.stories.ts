import { Meta, Story } from '@storybook/vue3';
import MkDigitalClock from './MkDigitalClock.vue';
const meta = {
	title: 'components/MkDigitalClock',
	component: MkDigitalClock,
};
export const Default = {
	components: {
		MkDigitalClock,
	},
	template: '<MkDigitalClock />',
	parameters: {
		layout: 'centered',
	},
};
export default meta;

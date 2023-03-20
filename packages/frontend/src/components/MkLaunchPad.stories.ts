import { Meta, Story } from '@storybook/vue3';
import MkLaunchPad from './MkLaunchPad.vue';
const meta = {
	title: 'components/MkLaunchPad',
	component: MkLaunchPad,
};
export const Default = {
	components: {
		MkLaunchPad,
	},
	template: '<MkLaunchPad />',
	parameters: {
		layout: 'centered',
	},
};
export default meta;

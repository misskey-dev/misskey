import { Meta, Story } from '@storybook/vue3';
import MkSwitch from './MkSwitch.vue';
const meta = {
	title: 'components/MkSwitch',
	component: MkSwitch,
};
export const Default = {
	components: {
		MkSwitch,
	},
	template: '<MkSwitch />',
	parameters: {
		layout: 'centered',
	},
};
export default meta;

import { Meta, Story } from '@storybook/vue3';
import MkCwButton from './MkCwButton.vue';
const meta = {
	title: 'components/MkCwButton',
	component: MkCwButton,
};
export const Default = {
	components: {
		MkCwButton,
	},
	template: '<MkCwButton />',
	parameters: {
		layout: 'centered',
	},
};
export default meta;

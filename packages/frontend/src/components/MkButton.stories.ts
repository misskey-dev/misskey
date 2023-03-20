import { Meta, Story } from '@storybook/vue3';
import MkButton from './MkButton.vue';
const meta = {
	title: 'components/MkButton',
	component: MkButton,
};
export const Default = {
	components: {
		MkButton,
	},
	template: '<MkButton />',
	parameters: {
		layout: 'centered',
	},
};
export default meta;

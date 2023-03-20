import { Meta, Story } from '@storybook/vue3';
import MkError from './MkError.vue';
const meta = {
	title: 'components/global/MkError',
	component: MkError,
};
export const Default = {
	components: {
		MkError,
	},
	template: '<MkError />',
	parameters: {
		layout: 'centered',
	},
};
export default meta;

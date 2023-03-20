import { Meta, Story } from '@storybook/vue3';
import MkTime from './MkTime.vue';
const meta = {
	title: 'components/global/MkTime',
	component: MkTime,
};
export const Default = {
	components: {
		MkTime,
	},
	template: '<MkTime />',
	parameters: {
		layout: 'centered',
	},
};
export default meta;

import { Meta, Story } from '@storybook/vue3';
import MkEllipsis from './MkEllipsis.vue';
const meta = {
	title: 'components/global/MkEllipsis',
	component: MkEllipsis,
};
export const Default = {
	components: {
		MkEllipsis,
	},
	template: '<MkEllipsis />',
	parameters: {
		layout: 'centered',
	},
};
export default meta;

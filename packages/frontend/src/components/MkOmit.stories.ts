import { Meta, Story } from '@storybook/vue3';
import MkOmit from './MkOmit.vue';
const meta = {
	title: 'components/MkOmit',
	component: MkOmit,
};
export const Default = {
	components: {
		MkOmit,
	},
	template: '<MkOmit />',
	parameters: {
		layout: 'centered',
	},
};
export default meta;

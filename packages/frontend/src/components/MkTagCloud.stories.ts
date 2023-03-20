import { Meta, Story } from '@storybook/vue3';
import MkTagCloud from './MkTagCloud.vue';
const meta = {
	title: 'components/MkTagCloud',
	component: MkTagCloud,
};
export const Default = {
	components: {
		MkTagCloud,
	},
	template: '<MkTagCloud />',
	parameters: {
		layout: 'centered',
	},
};
export default meta;

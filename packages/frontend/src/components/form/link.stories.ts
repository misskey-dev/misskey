import { Meta, Story } from '@storybook/vue3';
import link from './link.vue';
const meta = {
	title: 'components/form/link',
	component: link,
};
export const Default = {
	components: {
		link,
	},
	template: '<link />',
	parameters: {
		layout: 'centered',
	},
};
export default meta;

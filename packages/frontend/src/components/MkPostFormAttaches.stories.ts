import { Meta, Story } from '@storybook/vue3';
import MkPostFormAttaches from './MkPostFormAttaches.vue';
const meta = {
	title: 'components/MkPostFormAttaches',
	component: MkPostFormAttaches,
};
export const Default = {
	components: {
		MkPostFormAttaches,
	},
	template: '<MkPostFormAttaches />',
	parameters: {
		layout: 'centered',
	},
};
export default meta;

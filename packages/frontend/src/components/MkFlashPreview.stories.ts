import { Meta, Story } from '@storybook/vue3';
import MkFlashPreview from './MkFlashPreview.vue';
const meta = {
	title: 'components/MkFlashPreview',
	component: MkFlashPreview,
};
export const Default = {
	components: {
		MkFlashPreview,
	},
	template: '<MkFlashPreview />',
	parameters: {
		layout: 'centered',
	},
};
export default meta;

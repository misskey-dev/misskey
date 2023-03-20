import { Meta, Story } from '@storybook/vue3';
import MkClipPreview from './MkClipPreview.vue';
const meta = {
	title: 'components/MkClipPreview',
	component: MkClipPreview,
};
export const Default = {
	components: {
		MkClipPreview,
	},
	template: '<MkClipPreview />',
	parameters: {
		layout: 'centered',
	},
};
export default meta;

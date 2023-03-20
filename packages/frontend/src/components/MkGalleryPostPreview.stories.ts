import { Meta, Story } from '@storybook/vue3';
import MkGalleryPostPreview from './MkGalleryPostPreview.vue';
const meta = {
	title: 'components/MkGalleryPostPreview',
	component: MkGalleryPostPreview,
};
export const Default = {
	components: {
		MkGalleryPostPreview,
	},
	template: '<MkGalleryPostPreview />',
	parameters: {
		layout: 'centered',
	},
};
export default meta;

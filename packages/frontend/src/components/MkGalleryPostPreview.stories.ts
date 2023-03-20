import { Meta, Story } from '@storybook/vue3';
import MkGalleryPostPreview from './MkGalleryPostPreview.vue';
const meta = {
	title: 'components/MkGalleryPostPreview',
	component: MkGalleryPostPreview,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkGalleryPostPreview,
			},
			props: Object.keys(argTypes),
			template: '<MkGalleryPostPreview v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
};
export default meta;

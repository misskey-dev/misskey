/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import MkGalleryPostPreview from './MkGalleryPostPreview.vue';
const meta = {
	title: 'components/MkGalleryPostPreview',
	component: MkGalleryPostPreview,
} satisfies Meta<typeof MkGalleryPostPreview>;
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
} satisfies StoryObj<typeof MkGalleryPostPreview>;
export default meta;

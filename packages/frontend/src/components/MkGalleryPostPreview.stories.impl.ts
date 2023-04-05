/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { StoryObj } from '@storybook/vue3';
import { galleryPost } from '../../.storybook/fakes';
import MkGalleryPostPreview from './MkGalleryPostPreview.vue';
export const Default = {
	render(args) {
		return {
			components: {
				MkGalleryPostPreview,
			},
			setup() {
				return {
					args,
				};
			},
			computed: {
				props() {
					return {
						...this.args,
					};
				},
			},
			template: '<MkGalleryPostPreview v-bind="props" />',
		};
	},
	args: {
		post: galleryPost(),
	},
	decorators: [
		() => ({
			template: '<div style="width:260px"><story /></div>',
		}),
	],
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkGalleryPostPreview>;
export const Sensitive = {
	...Default,
	args: {
		...Default.args,
		post: galleryPost(true),
	},
} satisfies StoryObj<typeof MkGalleryPostPreview>;

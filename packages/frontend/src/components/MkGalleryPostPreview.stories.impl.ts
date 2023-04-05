/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { StoryObj } from '@storybook/vue3';
import { galleryPost } from '../../.storybook/fakes';
import MkGalleryPostPreview from './MkGalleryPostPreview.vue';
import { userEvent, within } from '@storybook/testing-library';
import { expect } from '@storybook/jest';
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
	async play({ canvasElement }) {
		const canvas = within(canvasElement);
		const links = canvas.getAllByRole('link');
		await expect(links).toHaveLength(2);
		await expect(links[0]).toHaveAttribute('href', `/gallery/${galleryPost().id}`);
		await expect(links[1]).toHaveAttribute('href', `/@${galleryPost().user.username}@${galleryPost().user.host}`);
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
export const Hover = {
	...Default,
	async play(context) {
		await Default.play(context);
		const canvas = within(context.canvasElement);
		const links = canvas.getAllByRole('link');
		await userEvent.hover(links[0]);
	},
} satisfies StoryObj<typeof MkGalleryPostPreview>;
export const HoverThenUnhover = {
	...Default,
	async play(context) {
		await Hover.play(context);
		const canvas = within(context.canvasElement);
		const links = canvas.getAllByRole('link');
		await userEvent.unhover(links[0]);
	},
} satisfies StoryObj<typeof MkGalleryPostPreview>;
export const Sensitive = {
	...Default,
	args: {
		...Default.args,
		post: galleryPost(true),
	},
} satisfies StoryObj<typeof MkGalleryPostPreview>;
export const SensitiveHover = {
	...Hover,
	args: {
		...Hover.args,
		post: galleryPost(true),
	},
} satisfies StoryObj<typeof MkGalleryPostPreview>;
export const SensitiveHoverThenUnhover = {
	...HoverThenUnhover,
	args: {
		...HoverThenUnhover.args,
		post: galleryPost(true),
	},
} satisfies StoryObj<typeof MkGalleryPostPreview>;

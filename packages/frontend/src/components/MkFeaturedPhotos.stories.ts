/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import MkFeaturedPhotos from './MkFeaturedPhotos.vue';
const meta = {
	title: 'components/MkFeaturedPhotos',
	component: MkFeaturedPhotos,
} satisfies Meta<typeof MkFeaturedPhotos>;
export const Default = {
	render(args) {
		return {
			components: {
				MkFeaturedPhotos,
			},
			setup() {
				return {
					args,
				};
			},
			computed: {
				props() {
					return {
						...args,
					};
				},
			},
			template: '<MkFeaturedPhotos v-bind="props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkFeaturedPhotos>;
export default meta;

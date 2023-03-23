/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import gallery_ from './gallery.vue';
const meta = {
	title: 'pages/user/gallery',
	component: gallery_,
} satisfies Meta<typeof gallery_>;
export const Default = {
	render(args) {
		return {
			components: {
				gallery_,
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
			template: '<gallery_ v-bind="props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof gallery_>;
export default meta;

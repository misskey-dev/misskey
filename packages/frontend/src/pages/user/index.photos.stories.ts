/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import index_photos from './index.photos.vue';
const meta = {
	title: 'pages/user/index.photos',
	component: index_photos,
} satisfies Meta<typeof index_photos>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				index_photos,
			},
			props: Object.keys(argTypes),
			template: '<index_photos v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof index_photos>;
export default meta;

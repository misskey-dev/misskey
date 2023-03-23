/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import clip_ from './clip.vue';
const meta = {
	title: 'pages/clip',
	component: clip_,
} satisfies Meta<typeof clip_>;
export const Default = {
	render(args) {
		return {
			components: {
				clip_,
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
			template: '<clip_ v-bind="props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof clip_>;
export default meta;

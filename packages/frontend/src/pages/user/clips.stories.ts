/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import clips_ from './clips.vue';
const meta = {
	title: 'pages/user/clips',
	component: clips_,
} satisfies Meta<typeof clips_>;
export const Default = {
	render(args) {
		return {
			components: {
				clips_,
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
			template: '<clips_ v-bind="props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof clips_>;
export default meta;

/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import edit_ from './edit.vue';
const meta = {
	title: 'pages/gallery/edit',
	component: edit_,
} satisfies Meta<typeof edit_>;
export const Default = {
	render(args) {
		return {
			components: {
				edit_,
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
			template: '<edit_ v-bind="props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof edit_>;
export default meta;

/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import editor_ from './editor.vue';
const meta = {
	title: 'pages/my-antennas/editor',
	component: editor_,
} satisfies Meta<typeof editor_>;
export const Default = {
	render(args) {
		return {
			components: {
				editor_,
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
			template: '<editor_ v-bind="props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof editor_>;
export default meta;

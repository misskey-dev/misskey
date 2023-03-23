/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import note_ from './note.vue';
const meta = {
	title: 'pages/note',
	component: note_,
} satisfies Meta<typeof note_>;
export const Default = {
	render(args) {
		return {
			components: {
				note_,
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
			template: '<note_ v-bind="props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof note_>;
export default meta;

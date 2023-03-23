/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import MkNoteDetailed from './MkNoteDetailed.vue';
const meta = {
	title: 'components/MkNoteDetailed',
	component: MkNoteDetailed,
} satisfies Meta<typeof MkNoteDetailed>;
export const Default = {
	render(args) {
		return {
			components: {
				MkNoteDetailed,
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
			template: '<MkNoteDetailed v-bind="props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkNoteDetailed>;
export default meta;

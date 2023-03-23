/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import MkNoteHeader from './MkNoteHeader.vue';
const meta = {
	title: 'components/MkNoteHeader',
	component: MkNoteHeader,
} satisfies Meta<typeof MkNoteHeader>;
export const Default = {
	render(args) {
		return {
			components: {
				MkNoteHeader,
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
			template: '<MkNoteHeader v-bind="props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkNoteHeader>;
export default meta;

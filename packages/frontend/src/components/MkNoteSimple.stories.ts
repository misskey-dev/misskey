/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import MkNoteSimple from './MkNoteSimple.vue';
const meta = {
	title: 'components/MkNoteSimple',
	component: MkNoteSimple,
} satisfies Meta<typeof MkNoteSimple>;
export const Default = {
	render(args) {
		return {
			components: {
				MkNoteSimple,
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
			template: '<MkNoteSimple v-bind="props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkNoteSimple>;
export default meta;

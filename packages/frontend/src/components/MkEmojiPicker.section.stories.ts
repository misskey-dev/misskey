/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import MkEmojiPicker_section from './MkEmojiPicker.section.vue';
const meta = {
	title: 'components/MkEmojiPicker.section',
	component: MkEmojiPicker_section,
} satisfies Meta<typeof MkEmojiPicker_section>;
export const Default = {
	render(args) {
		return {
			components: {
				MkEmojiPicker_section,
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
			template: '<MkEmojiPicker_section v-bind="props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkEmojiPicker_section>;
export default meta;

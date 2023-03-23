/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import MkCustomEmoji from './MkCustomEmoji.vue';
const meta = {
	title: 'components/global/MkCustomEmoji',
	component: MkCustomEmoji,
} satisfies Meta<typeof MkCustomEmoji>;
export const Default = {
	render(args) {
		return {
			components: {
				MkCustomEmoji,
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
			template: '<MkCustomEmoji v-bind="props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkCustomEmoji>;
export default meta;

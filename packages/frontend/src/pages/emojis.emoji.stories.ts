/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import emojis_emoji from './emojis.emoji.vue';
const meta = {
	title: 'pages/emojis.emoji',
	component: emojis_emoji,
} satisfies Meta<typeof emojis_emoji>;
export const Default = {
	render(args) {
		return {
			components: {
				emojis_emoji,
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
			template: '<emojis_emoji v-bind="props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof emojis_emoji>;
export default meta;

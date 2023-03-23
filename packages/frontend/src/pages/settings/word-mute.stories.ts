/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import word_mute from './word-mute.vue';
const meta = {
	title: 'pages/settings/word-mute',
	component: word_mute,
} satisfies Meta<typeof word_mute>;
export const Default = {
	render(args) {
		return {
			components: {
				word_mute,
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
			template: '<word_mute v-bind="props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof word_mute>;
export default meta;

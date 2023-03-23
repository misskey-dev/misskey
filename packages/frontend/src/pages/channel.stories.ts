/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import channel_ from './channel.vue';
const meta = {
	title: 'pages/channel',
	component: channel_,
} satisfies Meta<typeof channel_>;
export const Default = {
	render(args) {
		return {
			components: {
				channel_,
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
			template: '<channel_ v-bind="props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof channel_>;
export default meta;

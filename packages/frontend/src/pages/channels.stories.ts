/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import channels_ from './channels.vue';
const meta = {
	title: 'pages/channels',
	component: channels_,
} satisfies Meta<typeof channels_>;
export const Default = {
	render(args) {
		return {
			components: {
				channels_,
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
			template: '<channels_ v-bind="props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof channels_>;
export default meta;

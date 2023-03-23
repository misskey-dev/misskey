/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import stream_indicator from './stream-indicator.vue';
const meta = {
	title: 'ui/_common_/stream-indicator',
	component: stream_indicator,
} satisfies Meta<typeof stream_indicator>;
export const Default = {
	render(args) {
		return {
			components: {
				stream_indicator,
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
			template: '<stream_indicator v-bind="props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof stream_indicator>;
export default meta;

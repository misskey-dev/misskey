import { Meta, StoryObj } from '@storybook/vue3';
import stream_indicator from './stream-indicator.vue';
const meta = {
	title: 'ui/_common_/stream-indicator',
	component: stream_indicator,
} satisfies Meta<typeof stream_indicator>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				stream_indicator,
			},
			props: Object.keys(argTypes),
			template: '<stream_indicator v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof stream_indicator>;
export default meta;

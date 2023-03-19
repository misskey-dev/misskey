import { Meta, Story } from '@storybook/vue3';
import stream_indicator from './stream-indicator.vue';
const meta = {
	title: 'ui/_common_/stream-indicator',
	component: stream_indicator,
};
export const Default = {
	components: {
		stream_indicator,
	},
	template: '<stream-indicator />',
};
export default meta;

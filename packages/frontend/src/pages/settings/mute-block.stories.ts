import { Meta, Story } from '@storybook/vue3';
import mute_block from './mute-block.vue';
const meta = {
	title: 'pages/settings/mute-block',
	component: mute_block,
};
export const Default = {
	components: {
		mute_block,
	},
	template: '<mute-block />',
};
export default meta;

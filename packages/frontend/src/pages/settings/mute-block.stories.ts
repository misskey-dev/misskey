import { Meta, Story } from '@storybook/vue3';
import mute_block from './mute-block.vue';
const meta = {
	title: 'pages/settings/mute-block',
	component: mute_block,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				mute_block,
			},
			props: Object.keys(argTypes),
			template: '<mute_block v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
};
export default meta;

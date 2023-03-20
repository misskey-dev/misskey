import { Meta, Story } from '@storybook/vue3';
import clip from './clip.vue';
const meta = {
	title: 'pages/clip',
	component: clip,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				clip,
			},
			props: Object.keys(argTypes),
			template: '<clip v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
};
export default meta;

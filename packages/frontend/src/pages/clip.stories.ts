import { Meta, StoryObj } from '@storybook/vue3';
import clip from './clip.vue';
const meta = {
	title: 'pages/clip',
	component: clip,
} satisfies Meta<typeof clip>;
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
} satisfies StoryObj<typeof clip>;
export default meta;

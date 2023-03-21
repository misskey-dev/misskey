import { Meta, StoryObj } from '@storybook/vue3';
import clips_ from './clips.vue';
const meta = {
	title: 'pages/user/clips',
	component: clips_,
} satisfies Meta<typeof clips_>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				clips_,
			},
			props: Object.keys(argTypes),
			template: '<clips_ v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof clips_>;
export default meta;

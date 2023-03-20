import { Meta, StoryObj } from '@storybook/vue3';
import clips from './clips.vue';
const meta = {
	title: 'pages/user/clips',
	component: clips,
} satisfies Meta<typeof clips>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				clips,
			},
			props: Object.keys(argTypes),
			template: '<clips v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof clips>;
export default meta;

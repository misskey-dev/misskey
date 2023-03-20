import { Meta, StoryObj } from '@storybook/vue3';
import MkMediaVideo from './MkMediaVideo.vue';
const meta = {
	title: 'components/MkMediaVideo',
	component: MkMediaVideo,
} satisfies Meta<typeof MkMediaVideo>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkMediaVideo,
			},
			props: Object.keys(argTypes),
			template: '<MkMediaVideo v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkMediaVideo>;
export default meta;

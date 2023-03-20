import { Meta, StoryObj } from '@storybook/vue3';
import MkYouTubePlayer from './MkYouTubePlayer.vue';
const meta = {
	title: 'components/MkYouTubePlayer',
	component: MkYouTubePlayer,
} satisfies Meta<typeof MkYouTubePlayer>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkYouTubePlayer,
			},
			props: Object.keys(argTypes),
			template: '<MkYouTubePlayer v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkYouTubePlayer>;
export default meta;

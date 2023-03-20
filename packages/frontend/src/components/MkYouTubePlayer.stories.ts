import { Meta, Story } from '@storybook/vue3';
import MkYouTubePlayer from './MkYouTubePlayer.vue';
const meta = {
	title: 'components/MkYouTubePlayer',
	component: MkYouTubePlayer,
};
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
};
export default meta;

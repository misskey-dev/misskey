import { Meta, Story } from '@storybook/vue3';
import MkYoutubePlayer from './MkYoutubePlayer.vue';
const meta = {
	title: 'components/MkYoutubePlayer',
	component: MkYoutubePlayer,
};
export const Default = {
	components: {
		MkYoutubePlayer,
	},
	template: '<MkYoutubePlayer />',
	parameters: {
		layout: 'centered',
	},
};
export default meta;

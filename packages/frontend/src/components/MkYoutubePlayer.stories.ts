import { Meta, Story } from '@storybook/vue3';
import MkYoutubePlayer from './MkYoutubePlayer.vue';
const meta = {
	title: 'components/MkYoutubePlayer',
	component: MkYoutubePlayer,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkYoutubePlayer,
			},
			props: Object.keys(argTypes),
			template: '<MkYoutubePlayer v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
};
export default meta;

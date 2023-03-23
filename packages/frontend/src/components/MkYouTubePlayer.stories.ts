/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import MkYouTubePlayer from './MkYouTubePlayer.vue';
const meta = {
	title: 'components/MkYouTubePlayer',
	component: MkYouTubePlayer,
} satisfies Meta<typeof MkYouTubePlayer>;
export const Default = {
	render(args) {
		return {
			components: {
				MkYouTubePlayer,
			},
			setup() {
				return {
					args,
				};
			},
			computed: {
				props() {
					return {
						...args,
					};
				},
			},
			template: '<MkYouTubePlayer v-bind="props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkYouTubePlayer>;
export default meta;

/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import MkMediaVideo from './MkMediaVideo.vue';
const meta = {
	title: 'components/MkMediaVideo',
	component: MkMediaVideo,
} satisfies Meta<typeof MkMediaVideo>;
export const Default = {
	render(args) {
		return {
			components: {
				MkMediaVideo,
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
			template: '<MkMediaVideo v-bind="props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkMediaVideo>;
export default meta;

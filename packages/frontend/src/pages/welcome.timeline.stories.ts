/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import welcome_timeline from './welcome.timeline.vue';
const meta = {
	title: 'pages/welcome.timeline',
	component: welcome_timeline,
} satisfies Meta<typeof welcome_timeline>;
export const Default = {
	render(args) {
		return {
			components: {
				welcome_timeline,
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
			template: '<welcome_timeline v-bind="props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof welcome_timeline>;
export default meta;

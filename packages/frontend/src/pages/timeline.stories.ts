/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import timeline_ from './timeline.vue';
const meta = {
	title: 'pages/timeline',
	component: timeline_,
} satisfies Meta<typeof timeline_>;
export const Default = {
	render(args) {
		return {
			components: {
				timeline_,
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
			template: '<timeline_ v-bind="props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof timeline_>;
export default meta;

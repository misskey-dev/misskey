/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import timeline_tutorial from './timeline.tutorial.vue';
const meta = {
	title: 'pages/timeline.tutorial',
	component: timeline_tutorial,
} satisfies Meta<typeof timeline_tutorial>;
export const Default = {
	render(args) {
		return {
			components: {
				timeline_tutorial,
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
			template: '<timeline_tutorial v-bind="props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof timeline_tutorial>;
export default meta;

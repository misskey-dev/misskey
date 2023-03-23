/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import follow_ from './follow.vue';
const meta = {
	title: 'pages/follow',
	component: follow_,
} satisfies Meta<typeof follow_>;
export const Default = {
	render(args) {
		return {
			components: {
				follow_,
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
			template: '<follow_ v-bind="props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof follow_>;
export default meta;

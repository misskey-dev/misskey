/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import follow_requests from './follow-requests.vue';
const meta = {
	title: 'pages/follow-requests',
	component: follow_requests,
} satisfies Meta<typeof follow_requests>;
export const Default = {
	render(args) {
		return {
			components: {
				follow_requests,
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
			template: '<follow_requests v-bind="props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof follow_requests>;
export default meta;

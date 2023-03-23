/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import overview_queue from './overview.queue.vue';
const meta = {
	title: 'pages/admin/overview.queue',
	component: overview_queue,
} satisfies Meta<typeof overview_queue>;
export const Default = {
	render(args) {
		return {
			components: {
				overview_queue,
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
			template: '<overview_queue v-bind="props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof overview_queue>;
export default meta;

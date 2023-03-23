/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import overview_instances from './overview.instances.vue';
const meta = {
	title: 'pages/admin/overview.instances',
	component: overview_instances,
} satisfies Meta<typeof overview_instances>;
export const Default = {
	render(args) {
		return {
			components: {
				overview_instances,
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
			template: '<overview_instances v-bind="props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof overview_instances>;
export default meta;

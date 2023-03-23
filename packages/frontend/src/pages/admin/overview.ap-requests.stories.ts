/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import overview_ap_requests from './overview.ap-requests.vue';
const meta = {
	title: 'pages/admin/overview.ap-requests',
	component: overview_ap_requests,
} satisfies Meta<typeof overview_ap_requests>;
export const Default = {
	render(args) {
		return {
			components: {
				overview_ap_requests,
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
			template: '<overview_ap_requests v-bind="props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof overview_ap_requests>;
export default meta;

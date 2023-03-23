/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import overview_federation from './overview.federation.vue';
const meta = {
	title: 'pages/admin/overview.federation',
	component: overview_federation,
} satisfies Meta<typeof overview_federation>;
export const Default = {
	render(args) {
		return {
			components: {
				overview_federation,
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
			template: '<overview_federation v-bind="props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof overview_federation>;
export default meta;

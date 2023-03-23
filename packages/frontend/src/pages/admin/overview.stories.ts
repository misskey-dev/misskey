/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import overview_ from './overview.vue';
const meta = {
	title: 'pages/admin/overview',
	component: overview_,
} satisfies Meta<typeof overview_>;
export const Default = {
	render(args) {
		return {
			components: {
				overview_,
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
			template: '<overview_ v-bind="props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof overview_>;
export default meta;

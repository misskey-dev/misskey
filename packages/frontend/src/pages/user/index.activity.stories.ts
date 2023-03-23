/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import index_activity from './index.activity.vue';
const meta = {
	title: 'pages/user/index.activity',
	component: index_activity,
} satisfies Meta<typeof index_activity>;
export const Default = {
	render(args) {
		return {
			components: {
				index_activity,
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
			template: '<index_activity v-bind="props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof index_activity>;
export default meta;

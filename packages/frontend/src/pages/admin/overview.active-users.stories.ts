/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import overview_active_users from './overview.active-users.vue';
const meta = {
	title: 'pages/admin/overview.active-users',
	component: overview_active_users,
} satisfies Meta<typeof overview_active_users>;
export const Default = {
	render(args) {
		return {
			components: {
				overview_active_users,
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
			template: '<overview_active_users v-bind="props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof overview_active_users>;
export default meta;

/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import WidgetOnlineUsers from './WidgetOnlineUsers.vue';
const meta = {
	title: 'widgets/WidgetOnlineUsers',
	component: WidgetOnlineUsers,
} satisfies Meta<typeof WidgetOnlineUsers>;
export const Default = {
	render(args) {
		return {
			components: {
				WidgetOnlineUsers,
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
			template: '<WidgetOnlineUsers v-bind="props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof WidgetOnlineUsers>;
export default meta;

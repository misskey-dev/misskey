/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import user_list_timeline from './user-list-timeline.vue';
const meta = {
	title: 'pages/user-list-timeline',
	component: user_list_timeline,
} satisfies Meta<typeof user_list_timeline>;
export const Default = {
	render(args) {
		return {
			components: {
				user_list_timeline,
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
			template: '<user_list_timeline v-bind="props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof user_list_timeline>;
export default meta;

/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import user_info from './user-info.vue';
const meta = {
	title: 'pages/user-info',
	component: user_info,
} satisfies Meta<typeof user_info>;
export const Default = {
	render(args) {
		return {
			components: {
				user_info,
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
			template: '<user_info v-bind="props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof user_info>;
export default meta;

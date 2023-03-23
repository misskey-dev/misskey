/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import user_tag from './user-tag.vue';
const meta = {
	title: 'pages/user-tag',
	component: user_tag,
} satisfies Meta<typeof user_tag>;
export const Default = {
	render(args) {
		return {
			components: {
				user_tag,
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
			template: '<user_tag v-bind="props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof user_tag>;
export default meta;

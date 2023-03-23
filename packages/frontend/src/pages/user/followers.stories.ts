/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import followers_ from './followers.vue';
const meta = {
	title: 'pages/user/followers',
	component: followers_,
} satisfies Meta<typeof followers_>;
export const Default = {
	render(args) {
		return {
			components: {
				followers_,
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
			template: '<followers_ v-bind="props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof followers_>;
export default meta;

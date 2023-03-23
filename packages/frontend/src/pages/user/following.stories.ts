/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import following_ from './following.vue';
const meta = {
	title: 'pages/user/following',
	component: following_,
} satisfies Meta<typeof following_>;
export const Default = {
	render(args) {
		return {
			components: {
				following_,
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
			template: '<following_ v-bind="props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof following_>;
export default meta;

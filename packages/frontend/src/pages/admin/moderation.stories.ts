/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import moderation_ from './moderation.vue';
const meta = {
	title: 'pages/admin/moderation',
	component: moderation_,
} satisfies Meta<typeof moderation_>;
export const Default = {
	render(args) {
		return {
			components: {
				moderation_,
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
			template: '<moderation_ v-bind="props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof moderation_>;
export default meta;

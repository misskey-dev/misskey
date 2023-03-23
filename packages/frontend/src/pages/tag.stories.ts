/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import tag_ from './tag.vue';
const meta = {
	title: 'pages/tag',
	component: tag_,
} satisfies Meta<typeof tag_>;
export const Default = {
	render(args) {
		return {
			components: {
				tag_,
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
			template: '<tag_ v-bind="props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof tag_>;
export default meta;

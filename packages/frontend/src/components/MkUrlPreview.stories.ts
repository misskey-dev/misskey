/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import MkUrlPreview from './MkUrlPreview.vue';
const meta = {
	title: 'components/MkUrlPreview',
	component: MkUrlPreview,
} satisfies Meta<typeof MkUrlPreview>;
export const Default = {
	render(args) {
		return {
			components: {
				MkUrlPreview,
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
			template: '<MkUrlPreview v-bind="props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkUrlPreview>;
export default meta;

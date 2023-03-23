/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import MkClipPreview from './MkClipPreview.vue';
const meta = {
	title: 'components/MkClipPreview',
	component: MkClipPreview,
} satisfies Meta<typeof MkClipPreview>;
export const Default = {
	render(args) {
		return {
			components: {
				MkClipPreview,
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
			template: '<MkClipPreview v-bind="props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkClipPreview>;
export default meta;

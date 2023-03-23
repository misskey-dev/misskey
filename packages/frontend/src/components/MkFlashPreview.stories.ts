/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import MkFlashPreview from './MkFlashPreview.vue';
const meta = {
	title: 'components/MkFlashPreview',
	component: MkFlashPreview,
} satisfies Meta<typeof MkFlashPreview>;
export const Default = {
	render(args) {
		return {
			components: {
				MkFlashPreview,
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
			template: '<MkFlashPreview v-bind="props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkFlashPreview>;
export default meta;

/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import MkUrlPreviewPopup from './MkUrlPreviewPopup.vue';
const meta = {
	title: 'components/MkUrlPreviewPopup',
	component: MkUrlPreviewPopup,
} satisfies Meta<typeof MkUrlPreviewPopup>;
export const Default = {
	render(args) {
		return {
			components: {
				MkUrlPreviewPopup,
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
			template: '<MkUrlPreviewPopup v-bind="props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkUrlPreviewPopup>;
export default meta;

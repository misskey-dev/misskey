/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import MkPagePreview from './MkPagePreview.vue';
const meta = {
	title: 'components/MkPagePreview',
	component: MkPagePreview,
} satisfies Meta<typeof MkPagePreview>;
export const Default = {
	render(args) {
		return {
			components: {
				MkPagePreview,
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
			template: '<MkPagePreview v-bind="props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkPagePreview>;
export default meta;

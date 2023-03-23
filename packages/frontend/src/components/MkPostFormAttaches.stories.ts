/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import MkPostFormAttaches from './MkPostFormAttaches.vue';
const meta = {
	title: 'components/MkPostFormAttaches',
	component: MkPostFormAttaches,
} satisfies Meta<typeof MkPostFormAttaches>;
export const Default = {
	render(args) {
		return {
			components: {
				MkPostFormAttaches,
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
			template: '<MkPostFormAttaches v-bind="props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkPostFormAttaches>;
export default meta;

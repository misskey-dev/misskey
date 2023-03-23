/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import MkChannelPreview from './MkChannelPreview.vue';
const meta = {
	title: 'components/MkChannelPreview',
	component: MkChannelPreview,
} satisfies Meta<typeof MkChannelPreview>;
export const Default = {
	render(args) {
		return {
			components: {
				MkChannelPreview,
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
			template: '<MkChannelPreview v-bind="props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkChannelPreview>;
export default meta;

/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import MkMediaImage from './MkMediaImage.vue';
const meta = {
	title: 'components/MkMediaImage',
	component: MkMediaImage,
} satisfies Meta<typeof MkMediaImage>;
export const Default = {
	render(args) {
		return {
			components: {
				MkMediaImage,
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
			template: '<MkMediaImage v-bind="props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkMediaImage>;
export default meta;

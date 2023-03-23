/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import MkNumber from './MkNumber.vue';
const meta = {
	title: 'components/MkNumber',
	component: MkNumber,
} satisfies Meta<typeof MkNumber>;
export const Default = {
	render(args) {
		return {
			components: {
				MkNumber,
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
			template: '<MkNumber v-bind="props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkNumber>;
export default meta;

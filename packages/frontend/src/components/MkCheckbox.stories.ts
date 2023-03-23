/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import MkCheckbox from './MkCheckbox.vue';
const meta = {
	title: 'components/MkCheckbox',
	component: MkCheckbox,
} satisfies Meta<typeof MkCheckbox>;
export const Default = {
	render(args) {
		return {
			components: {
				MkCheckbox,
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
			template: '<MkCheckbox v-bind="props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkCheckbox>;
export default meta;

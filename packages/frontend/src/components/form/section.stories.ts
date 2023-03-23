/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import section_ from './section.vue';
const meta = {
	title: 'components/form/section',
	component: section_,
} satisfies Meta<typeof section_>;
export const Default = {
	render(args) {
		return {
			components: {
				section_,
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
			template: '<section_ v-bind="props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof section_>;
export default meta;

/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import MkError from './MkError.vue';
import * as storiesMeta from './MkError.stories.meta';
const meta = {
	title: 'components/global/MkError',
	component: MkError,
	...storiesMeta,
} satisfies Meta<typeof MkError>;
export const Default = {
	render(args) {
		return {
			components: {
				MkError,
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
			template: '<MkError v-bind="props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkError>;
export default meta;

/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import MkNumberDiff from './MkNumberDiff.vue';
const meta = {
	title: 'components/MkNumberDiff',
	component: MkNumberDiff,
} satisfies Meta<typeof MkNumberDiff>;
export const Default = {
	render(args) {
		return {
			components: {
				MkNumberDiff,
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
			template: '<MkNumberDiff v-bind="props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkNumberDiff>;
export default meta;

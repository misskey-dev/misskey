/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import MkPollEditor from './MkPollEditor.vue';
const meta = {
	title: 'components/MkPollEditor',
	component: MkPollEditor,
} satisfies Meta<typeof MkPollEditor>;
export const Default = {
	render(args) {
		return {
			components: {
				MkPollEditor,
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
			template: '<MkPollEditor v-bind="props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkPollEditor>;
export default meta;

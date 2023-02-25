import { inject } from 'yohira';

export function Injectable(): ClassDecorator {
	return () => {};
}

export function Inject(
	...params: Parameters<typeof inject>
): ReturnType<typeof inject> {
	return inject(...params);
}

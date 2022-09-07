import { Container, Service } from 'typedi';

@Service()
export class FooService {
	constructor(
	) {}

	public foo() {
		console.log('foo');
	}
}

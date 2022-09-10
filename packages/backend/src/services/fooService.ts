import { Container, Service } from 'typedi';

@Injectable()
export class FooService {
	constructor(
	) {}

	public foo() {
		console.log('foo');
	}
}

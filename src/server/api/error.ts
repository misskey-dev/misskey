export class ApiError extends Error {
	public message: string;
	public code: string;
	public id: string;

	constructor(e?: { message: string, code: string, id: string }) {
		if (e == null) e = {
			message: 'Internal error occured.',
			code: 'INTERNAL_ERROR',
			id: '5d37dbcb-891e-41ca-a3d6-e690c97775ac'
		};

		super(e.message);
		this.message = e.message;
		this.code = e.code;
		this.id = e.id;
	}
}

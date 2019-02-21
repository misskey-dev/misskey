export class ApiError extends Error {
	public message: string;
	public code: string;
	public id: string;

	constructor(e: { message: string, code: string, id: string }) {
		super(e.message);
		this.message = e.message;
		this.code = e.code;
		this.id = e.id;
	}
}

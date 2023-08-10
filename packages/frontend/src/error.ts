export function ErrorHandling(message: string): Error {
    const error = new Error(message);
    if (process.env.NODE_ENV === "production") {
        error.stack = undefined;
    }
    return error;
}

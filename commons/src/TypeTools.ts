export class TypeTools {
	static isString(input : any) {
		return (typeof input == 'string' || input instanceof String);
	}
}

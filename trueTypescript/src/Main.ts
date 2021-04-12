import IType from "./IType";

export default class Main implements IType {

    getType(name: number): string {
        return typeof this
    }
}

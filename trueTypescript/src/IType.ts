import IA from "./IA";
import IB from "./IB";

export default interface IType extends IA, IB {
    getType(name: number): string
}

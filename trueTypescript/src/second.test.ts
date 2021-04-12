import IA from './IA'
import IB from './IB'

class Base {
}

interface IType extends IA, IB {
    getType(name: number): string
}

class Main extends Base implements IType {

    getType(name: number): string {
        return typeof this
    }
}

describe('test', () => {


    test('test dependencies', () => {

        let a = new Main();

        console.log(a instanceof IType)
    })
})

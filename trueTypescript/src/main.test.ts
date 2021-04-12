import IType from './IType'
import Main from './Main'

describe('test', () => {
    test('test dependencies', () => {

        let a = new Main();
        console.log(a instanceof IType)
    })
})

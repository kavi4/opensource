module.exports = function ({types: t}) {

    function getImplementationExpression(name) {
        return t.conditionalExpression(
            t.memberExpression(t.identifier(name), t.identifier('$implements')),
            t.memberExpression(t.identifier(name), t.identifier('$implements')),
            t.identifier(name)
        )
    }

    function isProcessed(node) {

        if (node.body && node.body.body) {
            let props = node.body.body.filter((item) => {
                return t.isClassProperty(item) && item.key.name === '$implements'
            })

            if (props.length > 0) {
                return true
            }
        }

        return false
    }

    function getIsMethod() {
        return t.classMethod('method',
            t.identifier('is'),
            [t.identifier('type')],
            t.blockStatement([
                t.returnStatement(
                    t.callExpression(
                        t.memberExpression(
                            t.memberExpression(
                                t.identifier('type'), t.identifier('$implements')
                            ),
                            t.identifier('includes')
                        ),
                        [t.thisExpression()]
                    )
                )
            ]),
            false,
            true
        )
    }

    function getInstanceOfOverload() {
        return t.classMethod('method',
            t.memberExpression(t.identifier('Symbol'), t.identifier('hasInstance')),
            [t.identifier('instance')],
            t.blockStatement([
                t.variableDeclaration('let', [
                    t.variableDeclarator(t.identifier('type'), t.memberExpression(t.identifier('instance'), t.identifier('constructor')))
                ]),
                t.returnStatement(
                    t.callExpression(
                        t.memberExpression(
                            t.memberExpression(
                                t.identifier('type'), t.identifier('$implements')
                            ),
                            t.identifier('includes')
                        ),
                        [t.thisExpression()]
                    )
                )
            ]),
            true,
            true
        )
    }

    function addImplementations(declaration, path) {

        if (isProcessed(declaration)) {
            return
        }

        let classImplementations = []

        if (t.isTSInterfaceDeclaration(declaration)) {
            let props = []
            let methods = []

            declaration.body.body.forEach((item) => {

                if (t.isTSMethodSignature(item)) {
                    methods.push(t.classMethod(
                        'method',
                        item.key,
                        item.parameters,
                        t.blockStatement([]),
                        item.computed,
                        false,
                        false,
                        false)
                    )
                }

                if (t.isTSPropertySignature(item)) {
                    props.push(t.classProperty(item.id, undefined, item.typeAnnotation, [], item.computed))
                }
            })

            if (Array.isArray(declaration.extends)) {
                classImplementations = declaration.extends.map((item) => {
                    return getImplementationExpression(item.expression.name)
                })
            }

            declaration = t.classDeclaration(declaration.id, null, t.classBody([...props, ...methods]))
        }

        if (t.isClassDeclaration(declaration)) {

            if (declaration.superClass) {
                classImplementations.push(getImplementationExpression(declaration.superClass.name))
            }

            if (Array.isArray(declaration.implements)) {
                declaration.implements.forEach((element) => {
                    if (t.isTSExpressionWithTypeArguments(element)) {
                        classImplementations.push(getImplementationExpression(element.expression.name))
                    }
                })
            }

            classImplementations.push(declaration.id)

            if (declaration.body.body) {
                declaration.body.body.push(
                    t.classProperty(
                        t.identifier('$implements'),
                        t.callExpression(
                            t.memberExpression(
                                t.arrayExpression(classImplementations), t.identifier('flat')
                            ),
                            []
                        ),
                        t.typeAnnotation(t.arrayTypeAnnotation(t.anyTypeAnnotation())),
                        [],
                        null,
                        true
                    )
                )

                declaration.body.body.push(getInstanceOfOverload())
                declaration.body.body.push(getIsMethod())
            }
        }

        path.replaceWith(declaration)
    }

    return {
        name: 'true-typescript',
        visitor: {
            Program(programPath) {
                programPath.traverse({
                    ClassDeclaration(path) {
                        addImplementations(path.node, path)
                    },
                    TSInterfaceDeclaration(path) {
                        addImplementations(path.node, path)
                    }
                })
            }
        }
    };
};

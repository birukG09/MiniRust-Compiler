/**
 * MiniRust Semantic Analyzer
 * Performs type checking, symbol table management, and ownership analysis
 */

class Symbol {
    constructor(name, type, isMutable = false, line = null, column = null) {
        this.name = name;
        this.type = type;
        this.isMutable = isMutable;
        this.line = line;
        this.column = column;
        this.isUsed = false;
        this.borrowState = 'owned'; // 'owned', 'borrowed', 'mutably_borrowed'
        this.borrowCount = 0;
        this.mutableBorrowCount = 0;
    }
}

class Scope {
    constructor(parent = null) {
        this.parent = parent;
        this.symbols = new Map();
    }

    define(symbol) {
        if (this.symbols.has(symbol.name)) {
            return false; // Symbol already defined in this scope
        }
        this.symbols.set(symbol.name, symbol);
        return true;
    }

    lookup(name) {
        if (this.symbols.has(name)) {
            return this.symbols.get(name);
        }
        if (this.parent) {
            return this.parent.lookup(name);
        }
        return null;
    }

    getAllSymbols() {
        const symbols = new Map(this.symbols);
        if (this.parent) {
            const parentSymbols = this.parent.getAllSymbols();
            parentSymbols.forEach((symbol, name) => {
                if (!symbols.has(name)) {
                    symbols.set(name, symbol);
                }
            });
        }
        return symbols;
    }
}

class MiniRustSemanticAnalyzer {
    constructor() {
        this.globalScope = new Scope();
        this.currentScope = this.globalScope;
        this.errors = [];
        this.warnings = [];
        this.ownershipInfo = [];
        this.currentFunction = null;
        
        // Initialize built-in types and functions
        this.initializeBuiltins();
    }

    initializeBuiltins() {
        // Built-in print function
        const printSymbol = new Symbol('print', 'function', false);
        this.globalScope.define(printSymbol);
    }

    analyze(ast, checkOwnership = true) {
        this.errors = [];
        this.warnings = [];
        this.ownershipInfo = [];
        
        try {
            this.visitNode(ast);
            
            if (checkOwnership) {
                this.performOwnershipAnalysis(ast);
            }
            
            this.checkUnusedVariables();
            
            return {
                symbolTable: this.formatSymbolTable(),
                errors: this.errors,
                warnings: this.warnings,
                ownershipInfo: this.ownershipInfo,
                success: this.errors.length === 0
            };
        } catch (error) {
            this.errors.push({
                type: 'SemanticError',
                message: error.message,
                line: 0,
                column: 0
            });
            
            return {
                symbolTable: this.formatSymbolTable(),
                errors: this.errors,
                warnings: this.warnings,
                ownershipInfo: this.ownershipInfo,
                success: false
            };
        }
    }

    visitNode(node) {
        if (!node) return null;

        switch (node.type) {
            case 'Program':
                return this.visitProgram(node);
            case 'FunctionDeclaration':
                return this.visitFunctionDeclaration(node);
            case 'VariableDeclaration':
                return this.visitVariableDeclaration(node);
            case 'IfStatement':
                return this.visitIfStatement(node);
            case 'WhileStatement':
                return this.visitWhileStatement(node);
            case 'Block':
                return this.visitBlock(node);
            case 'Assignment':
                return this.visitAssignment(node);
            case 'BinaryOperation':
                return this.visitBinaryOperation(node);
            case 'UnaryOperation':
                return this.visitUnaryOperation(node);
            case 'Identifier':
                return this.visitIdentifier(node);
            case 'IntegerLiteral':
                return { type: 'i32', value: node.value };
            case 'FloatLiteral':
                return { type: 'f64', value: node.value };
            case 'StringLiteral':
                return { type: 'str', value: node.value };
            case 'BooleanLiteral':
                return { type: 'bool', value: node.value };
            case 'PrintStatement':
                return this.visitPrintStatement(node);
            case 'ReturnStatement':
                return this.visitReturnStatement(node);
            default:
                // Visit children for unknown nodes
                for (const child of node.children) {
                    this.visitNode(child);
                }
                return null;
        }
    }

    visitProgram(node) {
        for (const child of node.children) {
            this.visitNode(child);
        }
        return null;
    }

    visitFunctionDeclaration(node) {
        const nameNode = node.children.find(child => child.type === 'FunctionName');
        const paramsNode = node.children.find(child => child.type === 'Parameters');
        const returnTypeNode = node.children.find(child => child.type === 'ReturnType');
        const bodyNode = node.children.find(child => child.type === 'Block');

        const functionName = nameNode.value;
        const returnType = returnTypeNode ? returnTypeNode.value : 'void';

        // Create function symbol
        const functionSymbol = new Symbol(functionName, 'function', false, node.line, node.column);
        
        if (!this.currentScope.define(functionSymbol)) {
            this.errors.push({
                type: 'SemanticError',
                message: `Function '${functionName}' is already defined`,
                line: node.line,
                column: node.column
            });
        }

        // Enter function scope
        this.currentFunction = functionName;
        this.enterScope();

        // Process parameters
        if (paramsNode) {
            for (const paramNode of paramsNode.children) {
                const paramNameNode = paramNode.children.find(child => child.type === 'ParameterName');
                const paramTypeNode = paramNode.children.find(child => child.type === 'ParameterType');
                
                const paramSymbol = new Symbol(
                    paramNameNode.value,
                    paramTypeNode.value,
                    false,
                    paramNode.line,
                    paramNode.column
                );
                
                if (!this.currentScope.define(paramSymbol)) {
                    this.errors.push({
                        type: 'SemanticError',
                        message: `Parameter '${paramNameNode.value}' is already defined`,
                        line: paramNode.line,
                        column: paramNode.column
                    });
                }
            }
        }

        // Process function body
        this.visitNode(bodyNode);

        // Exit function scope
        this.exitScope();
        this.currentFunction = null;

        return { type: 'function', returnType: returnType };
    }

    visitVariableDeclaration(node) {
        const nameNode = node.children.find(child => child.type === 'VariableName');
        const mutabilityNode = node.children.find(child => child.type === 'Mutable');
        const typeNode = node.children.find(child => child.type === 'VariableType');
        const initValueNode = node.children.find(child => 
            !['VariableName', 'Mutable', 'VariableType'].includes(child.type)
        );

        const variableName = nameNode.value;
        const isMutable = mutabilityNode.value;
        let variableType = typeNode ? typeNode.value : null;

        // Type inference from initial value
        let initType = null;
        if (initValueNode) {
            const initResult = this.visitNode(initValueNode);
            if (initResult) {
                initType = initResult.type;
            }
        }

        // Determine final type
        if (variableType && initType) {
            if (variableType !== initType) {
                this.errors.push({
                    type: 'TypeError',
                    message: `Type mismatch: expected '${variableType}', found '${initType}'`,
                    line: node.line,
                    column: node.column
                });
            }
        } else if (initType) {
            variableType = initType;
        } else if (!variableType) {
            this.errors.push({
                type: 'TypeError',
                message: `Cannot infer type for variable '${variableName}'`,
                line: node.line,
                column: node.column
            });
            variableType = 'unknown';
        }

        // Create and define symbol
        const symbol = new Symbol(variableName, variableType, isMutable, node.line, node.column);
        
        if (!this.currentScope.define(symbol)) {
            this.errors.push({
                type: 'SemanticError',
                message: `Variable '${variableName}' is already defined in this scope`,
                line: node.line,
                column: node.column
            });
        }

        return { type: variableType };
    }

    visitAssignment(node) {
        const leftResult = this.visitNode(node.children[0]);
        const rightResult = this.visitNode(node.children[1]);

        if (!leftResult || !rightResult) {
            return null;
        }

        // Check if left side is assignable
        if (node.children[0].type === 'Identifier') {
            const variableName = node.children[0].value;
            const symbol = this.currentScope.lookup(variableName);
            
            if (symbol) {
                if (!symbol.isMutable) {
                    this.errors.push({
                        type: 'OwnershipError',
                        message: `Cannot assign to immutable variable '${variableName}'`,
                        line: node.line,
                        column: node.column
                    });
                }
                
                // Mark as used
                symbol.isUsed = true;
                
                // Type checking
                if (leftResult.type !== rightResult.type) {
                    this.errors.push({
                        type: 'TypeError',
                        message: `Type mismatch: cannot assign '${rightResult.type}' to '${leftResult.type}'`,
                        line: node.line,
                        column: node.column
                    });
                }
            }
        }

        return leftResult;
    }

    visitBinaryOperation(node) {
        const leftResult = this.visitNode(node.children[0]);
        const rightResult = this.visitNode(node.children[1]);
        const operator = node.value;

        if (!leftResult || !rightResult) {
            return null;
        }

        // Type checking for binary operations
        const arithmeticOps = ['+', '-', '*', '/', '%'];
        const comparisonOps = ['<', '<=', '>', '>=', '==', '!='];
        const logicalOps = ['&&', '||'];

        if (arithmeticOps.includes(operator)) {
            if (leftResult.type !== rightResult.type) {
                this.errors.push({
                    type: 'TypeError',
                    message: `Type mismatch in arithmetic operation: '${leftResult.type}' ${operator} '${rightResult.type}'`,
                    line: node.line,
                    column: node.column
                });
            }
            return { type: leftResult.type };
        }

        if (comparisonOps.includes(operator)) {
            if (leftResult.type !== rightResult.type) {
                this.errors.push({
                    type: 'TypeError',
                    message: `Type mismatch in comparison: '${leftResult.type}' ${operator} '${rightResult.type}'`,
                    line: node.line,
                    column: node.column
                });
            }
            return { type: 'bool' };
        }

        if (logicalOps.includes(operator)) {
            if (leftResult.type !== 'bool' || rightResult.type !== 'bool') {
                this.errors.push({
                    type: 'TypeError',
                    message: `Logical operations require boolean operands`,
                    line: node.line,
                    column: node.column
                });
            }
            return { type: 'bool' };
        }

        return { type: 'unknown' };
    }

    visitUnaryOperation(node) {
        const operandResult = this.visitNode(node.children[0]);
        const operator = node.value;

        if (!operandResult) {
            return null;
        }

        switch (operator) {
            case '-':
                if (operandResult.type !== 'i32' && operandResult.type !== 'f64') {
                    this.errors.push({
                        type: 'TypeError',
                        message: `Unary minus can only be applied to numeric types`,
                        line: node.line,
                        column: node.column
                    });
                }
                return { type: operandResult.type };
                
            case '!':
                if (operandResult.type !== 'bool') {
                    this.errors.push({
                        type: 'TypeError',
                        message: `Logical not can only be applied to boolean type`,
                        line: node.line,
                        column: node.column
                    });
                }
                return { type: 'bool' };
                
            case '&':
            case '&mut':
                // Borrowing operations
                this.handleBorrow(node.children[0], operator === '&mut');
                return { type: `&${operator === '&mut' ? 'mut ' : ''}${operandResult.type}` };
                
            default:
                return operandResult;
        }
    }

    visitIdentifier(node) {
        const name = node.value;
        const symbol = this.currentScope.lookup(name);

        if (!symbol) {
            this.errors.push({
                type: 'SemanticError',
                message: `Undefined variable '${name}'`,
                line: node.line,
                column: node.column
            });
            return { type: 'unknown' };
        }

        symbol.isUsed = true;
        return { type: symbol.type };
    }

    visitIfStatement(node) {
        const conditionResult = this.visitNode(node.children[0]);
        
        if (conditionResult && conditionResult.type !== 'bool') {
            this.errors.push({
                type: 'TypeError',
                message: `If condition must be of type bool, found '${conditionResult.type}'`,
                line: node.line,
                column: node.column
            });
        }

        // Visit branches
        this.visitNode(node.children[1]); // then branch
        if (node.children[2]) {
            this.visitNode(node.children[2]); // else branch
        }

        return null;
    }

    visitWhileStatement(node) {
        const conditionResult = this.visitNode(node.children[0]);
        
        if (conditionResult && conditionResult.type !== 'bool') {
            this.errors.push({
                type: 'TypeError',
                message: `While condition must be of type bool, found '${conditionResult.type}'`,
                line: node.line,
                column: node.column
            });
        }

        this.visitNode(node.children[1]); // body
        return null;
    }

    visitBlock(node) {
        this.enterScope();
        
        for (const child of node.children) {
            this.visitNode(child);
        }
        
        this.exitScope();
        return null;
    }

    visitPrintStatement(node) {
        const argResult = this.visitNode(node.children[0]);
        // print accepts any type
        return null;
    }

    visitReturnStatement(node) {
        if (node.children.length > 0) {
            const returnValueResult = this.visitNode(node.children[0]);
            // TODO: Check return type against function signature
        }
        return null;
    }

    // Ownership analysis methods
    performOwnershipAnalysis(ast) {
        this.ownershipInfo.push("=== Ownership Analysis ===");
        this.analyzeOwnership(ast);
    }

    analyzeOwnership(node) {
        if (!node) return;

        switch (node.type) {
            case 'VariableDeclaration':
                this.analyzeVariableOwnership(node);
                break;
            case 'Assignment':
                this.analyzeAssignmentOwnership(node);
                break;
            case 'UnaryOperation':
                if (node.value === '&' || node.value === '&mut') {
                    this.analyzeBorrowOwnership(node);
                }
                break;
        }

        // Recursively analyze children
        for (const child of node.children) {
            this.analyzeOwnership(child);
        }
    }

    analyzeVariableOwnership(node) {
        const nameNode = node.children.find(child => child.type === 'VariableName');
        const variableName = nameNode.value;
        
        this.ownershipInfo.push(`Variable '${variableName}' takes ownership of its value`);
    }

    analyzeAssignmentOwnership(node) {
        if (node.children[0].type === 'Identifier') {
            const variableName = node.children[0].value;
            this.ownershipInfo.push(`Assignment transfers ownership to '${variableName}'`);
        }
    }

    analyzeBorrowOwnership(node) {
        const isMutableBorrow = node.value === '&mut';
        const target = node.children[0];
        
        if (target.type === 'Identifier') {
            const variableName = target.value;
            const symbol = this.currentScope.lookup(variableName);
            
            if (symbol) {
                if (isMutableBorrow) {
                    if (symbol.mutableBorrowCount > 0) {
                        this.errors.push({
                            type: 'OwnershipError',
                            message: `Cannot create mutable borrow: '${variableName}' is already mutably borrowed`,
                            line: node.line,
                            column: node.column
                        });
                    } else if (symbol.borrowCount > 0) {
                        this.errors.push({
                            type: 'OwnershipError',
                            message: `Cannot create mutable borrow: '${variableName}' is already borrowed`,
                            line: node.line,
                            column: node.column
                        });
                    } else {
                        symbol.mutableBorrowCount++;
                        this.ownershipInfo.push(`Mutable borrow of '${variableName}'`);
                    }
                } else {
                    if (symbol.mutableBorrowCount > 0) {
                        this.errors.push({
                            type: 'OwnershipError',
                            message: `Cannot create immutable borrow: '${variableName}' is already mutably borrowed`,
                            line: node.line,
                            column: node.column
                        });
                    } else {
                        symbol.borrowCount++;
                        this.ownershipInfo.push(`Immutable borrow of '${variableName}'`);
                    }
                }
            }
        }
    }

    handleBorrow(target, isMutable) {
        if (target.type === 'Identifier') {
            const variableName = target.value;
            const symbol = this.currentScope.lookup(variableName);
            
            if (symbol) {
                if (isMutable && !symbol.isMutable) {
                    this.errors.push({
                        type: 'OwnershipError',
                        message: `Cannot create mutable borrow of immutable variable '${variableName}'`,
                        line: target.line,
                        column: target.column
                    });
                }
            }
        }
    }

    checkUnusedVariables() {
        const checkScope = (scope) => {
            scope.symbols.forEach((symbol, name) => {
                if (!symbol.isUsed && symbol.type !== 'function' && name !== 'print') {
                    this.warnings.push({
                        type: 'UnusedVariable',
                        message: `Variable '${name}' is declared but never used`,
                        line: symbol.line,
                        column: symbol.column
                    });
                }
            });
        };

        checkScope(this.globalScope);
    }

    // Scope management
    enterScope() {
        this.currentScope = new Scope(this.currentScope);
    }

    exitScope() {
        if (this.currentScope.parent) {
            this.currentScope = this.currentScope.parent;
        }
    }

    // Helper methods
    formatSymbolTable() {
        const allSymbols = this.globalScope.getAllSymbols();
        const formatted = {};
        
        allSymbols.forEach((symbol, name) => {
            formatted[name] = {
                type: symbol.type,
                mutable: symbol.isMutable,
                used: symbol.isUsed,
                line: symbol.line,
                column: symbol.column
            };
        });
        
        return formatted;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MiniRustSemanticAnalyzer, Symbol, Scope };
}

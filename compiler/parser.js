/**
 * MiniRust Parser
 * Builds Abstract Syntax Tree (AST) from tokens
 */

class ASTNode {
    constructor(type, value = null) {
        this.type = type;
        this.value = value;
        this.children = [];
        this.line = null;
        this.column = null;
    }

    addChild(child) {
        this.children.push(child);
        return this;
    }

    setPosition(line, column) {
        this.line = line;
        this.column = column;
        return this;
    }
}

class MiniRustParser {
    constructor() {
        this.tokens = [];
        this.current = 0;
        this.errors = [];
    }

    parse(tokens) {
        this.tokens = tokens;
        this.current = 0;
        this.errors = [];

        try {
            const ast = this.parseProgram();
            return {
                ast: ast,
                errors: this.errors
            };
        } catch (error) {
            this.errors.push({
                type: 'ParseError',
                message: error.message,
                line: this.getCurrentToken().line,
                column: this.getCurrentToken().column
            });
            return {
                ast: null,
                errors: this.errors
            };
        }
    }

    parseProgram() {
        const program = new ASTNode('Program');
        
        while (!this.isAtEnd() && this.getCurrentToken().type !== 'EOF') {
            try {
                const stmt = this.parseStatement();
                if (stmt) {
                    program.addChild(stmt);
                }
            } catch (error) {
                this.errors.push({
                    type: 'ParseError',
                    message: error.message,
                    line: this.getCurrentToken().line,
                    column: this.getCurrentToken().column
                });
                this.synchronize();
            }
        }

        return program;
    }

    parseStatement() {
        const token = this.getCurrentToken();

        if (token.type === 'KEYWORD') {
            switch (token.value) {
                case 'fn':
                    return this.parseFunctionDeclaration();
                case 'let':
                    return this.parseVariableDeclaration();
                case 'if':
                    return this.parseIfStatement();
                case 'while':
                    return this.parseWhileStatement();
                case 'return':
                    return this.parseReturnStatement();
                case 'print':
                    return this.parsePrintStatement();
                default:
                    return this.parseExpressionStatement();
            }
        }

        return this.parseExpressionStatement();
    }

    parseFunctionDeclaration() {
        const fnNode = new ASTNode('FunctionDeclaration');
        fnNode.setPosition(this.getCurrentToken().line, this.getCurrentToken().column);

        this.consume('KEYWORD', 'fn');
        
        const nameToken = this.consume('IDENTIFIER');
        fnNode.addChild(new ASTNode('FunctionName', nameToken.value));

        this.consume('LEFT_PAREN');
        
        // Parse parameters
        const params = new ASTNode('Parameters');
        if (this.getCurrentToken().type !== 'RIGHT_PAREN') {
            do {
                const paramName = this.consume('IDENTIFIER');
                this.consume('COLON');
                const paramType = this.consume('TYPE');
                
                const param = new ASTNode('Parameter')
                    .addChild(new ASTNode('ParameterName', paramName.value))
                    .addChild(new ASTNode('ParameterType', paramType.value));
                
                params.addChild(param);
                
                if (this.getCurrentToken().type === 'COMMA') {
                    this.advance();
                } else {
                    break;
                }
            } while (this.getCurrentToken().type !== 'RIGHT_PAREN');
        }
        fnNode.addChild(params);

        this.consume('RIGHT_PAREN');

        // Optional return type
        if (this.getCurrentToken().type === 'ARROW') {
            this.advance();
            const returnType = this.consume('TYPE');
            fnNode.addChild(new ASTNode('ReturnType', returnType.value));
        }

        // Function body
        const body = this.parseBlock();
        fnNode.addChild(body);

        return fnNode;
    }

    parseVariableDeclaration() {
        const letNode = new ASTNode('VariableDeclaration');
        letNode.setPosition(this.getCurrentToken().line, this.getCurrentToken().column);

        this.consume('KEYWORD', 'let');

        let isMutable = false;
        if (this.getCurrentToken().type === 'KEYWORD' && this.getCurrentToken().value === 'mut') {
            isMutable = true;
            this.advance();
        }

        const nameToken = this.consume('IDENTIFIER');
        letNode.addChild(new ASTNode('VariableName', nameToken.value));
        letNode.addChild(new ASTNode('Mutable', isMutable));

        // Type annotation
        if (this.getCurrentToken().type === 'COLON') {
            this.advance();
            const typeToken = this.consume('TYPE');
            letNode.addChild(new ASTNode('VariableType', typeToken.value));
        }

        // Initial value
        if (this.getCurrentToken().type === 'ASSIGN') {
            this.advance();
            const initialValue = this.parseExpression();
            letNode.addChild(initialValue);
        }

        this.consume('SEMICOLON');
        return letNode;
    }

    parseIfStatement() {
        const ifNode = new ASTNode('IfStatement');
        ifNode.setPosition(this.getCurrentToken().line, this.getCurrentToken().column);

        this.consume('KEYWORD', 'if');
        
        const condition = this.parseExpression();
        ifNode.addChild(condition);

        const thenBranch = this.parseBlock();
        ifNode.addChild(thenBranch);

        if (this.getCurrentToken().type === 'KEYWORD' && this.getCurrentToken().value === 'else') {
            this.advance();
            const elseBranch = this.parseBlock();
            ifNode.addChild(elseBranch);
        }

        return ifNode;
    }

    parseWhileStatement() {
        const whileNode = new ASTNode('WhileStatement');
        whileNode.setPosition(this.getCurrentToken().line, this.getCurrentToken().column);

        this.consume('KEYWORD', 'while');
        
        const condition = this.parseExpression();
        whileNode.addChild(condition);

        const body = this.parseBlock();
        whileNode.addChild(body);

        return whileNode;
    }

    parseReturnStatement() {
        const returnNode = new ASTNode('ReturnStatement');
        returnNode.setPosition(this.getCurrentToken().line, this.getCurrentToken().column);

        this.consume('KEYWORD', 'return');
        
        if (this.getCurrentToken().type !== 'SEMICOLON') {
            const value = this.parseExpression();
            returnNode.addChild(value);
        }

        this.consume('SEMICOLON');
        return returnNode;
    }

    parsePrintStatement() {
        const printNode = new ASTNode('PrintStatement');
        printNode.setPosition(this.getCurrentToken().line, this.getCurrentToken().column);

        this.consume('KEYWORD', 'print');
        this.consume('LEFT_PAREN');
        
        const expression = this.parseExpression();
        printNode.addChild(expression);
        
        this.consume('RIGHT_PAREN');
        this.consume('SEMICOLON');

        return printNode;
    }

    parseExpressionStatement() {
        const expr = this.parseExpression();
        this.consume('SEMICOLON');
        return expr;
    }

    parseBlock() {
        const block = new ASTNode('Block');
        block.setPosition(this.getCurrentToken().line, this.getCurrentToken().column);

        this.consume('LEFT_BRACE');

        while (this.getCurrentToken().type !== 'RIGHT_BRACE' && !this.isAtEnd()) {
            const stmt = this.parseStatement();
            if (stmt) {
                block.addChild(stmt);
            }
        }

        this.consume('RIGHT_BRACE');
        return block;
    }

    parseExpression() {
        return this.parseAssignment();
    }

    parseAssignment() {
        let expr = this.parseLogicalOr();

        if (this.getCurrentToken().type === 'ASSIGN') {
            const assignToken = this.advance();
            const value = this.parseAssignment();
            
            const assignNode = new ASTNode('Assignment');
            assignNode.setPosition(assignToken.line, assignToken.column);
            assignNode.addChild(expr);
            assignNode.addChild(value);
            
            return assignNode;
        }

        return expr;
    }

    parseLogicalOr() {
        let expr = this.parseLogicalAnd();

        while (this.getCurrentToken().type === 'LOGICAL_OR') {
            const operator = this.advance();
            const right = this.parseLogicalAnd();
            
            const binaryNode = new ASTNode('BinaryOperation', operator.value);
            binaryNode.setPosition(operator.line, operator.column);
            binaryNode.addChild(expr);
            binaryNode.addChild(right);
            
            expr = binaryNode;
        }

        return expr;
    }

    parseLogicalAnd() {
        let expr = this.parseEquality();

        while (this.getCurrentToken().type === 'LOGICAL_AND') {
            const operator = this.advance();
            const right = this.parseEquality();
            
            const binaryNode = new ASTNode('BinaryOperation', operator.value);
            binaryNode.setPosition(operator.line, operator.column);
            binaryNode.addChild(expr);
            binaryNode.addChild(right);
            
            expr = binaryNode;
        }

        return expr;
    }

    parseEquality() {
        let expr = this.parseComparison();

        while (this.match('EQUAL', 'NOT_EQUAL')) {
            const operator = this.previous();
            const right = this.parseComparison();
            
            const binaryNode = new ASTNode('BinaryOperation', operator.value);
            binaryNode.setPosition(operator.line, operator.column);
            binaryNode.addChild(expr);
            binaryNode.addChild(right);
            
            expr = binaryNode;
        }

        return expr;
    }

    parseComparison() {
        let expr = this.parseTerm();

        while (this.match('GREATER_THAN', 'GREATER_EQUAL', 'LESS_THAN', 'LESS_EQUAL')) {
            const operator = this.previous();
            const right = this.parseTerm();
            
            const binaryNode = new ASTNode('BinaryOperation', operator.value);
            binaryNode.setPosition(operator.line, operator.column);
            binaryNode.addChild(expr);
            binaryNode.addChild(right);
            
            expr = binaryNode;
        }

        return expr;
    }

    parseTerm() {
        let expr = this.parseFactor();

        while (this.match('PLUS', 'MINUS')) {
            const operator = this.previous();
            const right = this.parseFactor();
            
            const binaryNode = new ASTNode('BinaryOperation', operator.value);
            binaryNode.setPosition(operator.line, operator.column);
            binaryNode.addChild(expr);
            binaryNode.addChild(right);
            
            expr = binaryNode;
        }

        return expr;
    }

    parseFactor() {
        let expr = this.parseUnary();

        while (this.match('MULTIPLY', 'DIVIDE', 'MODULO')) {
            const operator = this.previous();
            const right = this.parseUnary();
            
            const binaryNode = new ASTNode('BinaryOperation', operator.value);
            binaryNode.setPosition(operator.line, operator.column);
            binaryNode.addChild(expr);
            binaryNode.addChild(right);
            
            expr = binaryNode;
        }

        return expr;
    }

    parseUnary() {
        if (this.match('LOGICAL_NOT', 'MINUS', 'BORROW', 'BORROW_MUT')) {
            const operator = this.previous();
            const right = this.parseUnary();
            
            const unaryNode = new ASTNode('UnaryOperation', operator.value);
            unaryNode.setPosition(operator.line, operator.column);
            unaryNode.addChild(right);
            
            return unaryNode;
        }

        return this.parsePrimary();
    }

    parsePrimary() {
        const token = this.getCurrentToken();

        if (token.type === 'INTEGER') {
            this.advance();
            const node = new ASTNode('IntegerLiteral', parseInt(token.value));
            node.setPosition(token.line, token.column);
            return node;
        }

        if (token.type === 'FLOAT') {
            this.advance();
            const node = new ASTNode('FloatLiteral', parseFloat(token.value));
            node.setPosition(token.line, token.column);
            return node;
        }

        if (token.type === 'STRING') {
            this.advance();
            const node = new ASTNode('StringLiteral', token.value);
            node.setPosition(token.line, token.column);
            return node;
        }

        if (token.type === 'KEYWORD' && (token.value === 'true' || token.value === 'false')) {
            this.advance();
            const node = new ASTNode('BooleanLiteral', token.value === 'true');
            node.setPosition(token.line, token.column);
            return node;
        }

        if (token.type === 'IDENTIFIER') {
            this.advance();
            const node = new ASTNode('Identifier', token.value);
            node.setPosition(token.line, token.column);
            return node;
        }

        if (token.type === 'LEFT_PAREN') {
            this.advance();
            const expr = this.parseExpression();
            this.consume('RIGHT_PAREN');
            return expr;
        }

        throw new Error(`Unexpected token: ${token.type} '${token.value}'`);
    }

    // Utility methods
    getCurrentToken() {
        if (this.isAtEnd()) {
            return this.tokens[this.tokens.length - 1]; // EOF token
        }
        return this.tokens[this.current];
    }

    previous() {
        return this.tokens[this.current - 1];
    }

    advance() {
        if (!this.isAtEnd()) {
            this.current++;
        }
        return this.previous();
    }

    isAtEnd() {
        return this.current >= this.tokens.length || 
               this.getCurrentToken().type === 'EOF';
    }

    match(...types) {
        for (const type of types) {
            if (this.check(type)) {
                this.advance();
                return true;
            }
        }
        return false;
    }

    check(type) {
        if (this.isAtEnd()) return false;
        return this.getCurrentToken().type === type;
    }

    consume(expectedType, expectedValue = null) {
        const token = this.getCurrentToken();
        
        if (token.type === expectedType && 
            (expectedValue === null || token.value === expectedValue)) {
            return this.advance();
        }
        
        const expected = expectedValue ? `${expectedType}('${expectedValue}')` : expectedType;
        throw new Error(`Expected ${expected}, but got ${token.type}('${token.value}')`);
    }

    synchronize() {
        this.advance();

        while (!this.isAtEnd()) {
            if (this.previous().type === 'SEMICOLON') return;

            const token = this.getCurrentToken();
            if (token.type === 'KEYWORD') {
                switch (token.value) {
                    case 'fn':
                    case 'let':
                    case 'if':
                    case 'while':
                    case 'return':
                        return;
                }
            }

            this.advance();
        }
    }

    // Helper method to format AST for display
    static formatASTForDisplay(node, indent = 0) {
        if (!node) return '';
        
        const indentStr = '  '.repeat(indent);
        let result = `${indentStr}${node.type}`;
        
        if (node.value !== null && node.value !== undefined) {
            result += `: ${JSON.stringify(node.value)}`;
        }
        
        if (node.line && node.column) {
            result += ` (${node.line}:${node.column})`;
        }
        
        result += '\n';
        
        for (const child of node.children) {
            result += this.formatASTForDisplay(child, indent + 1);
        }
        
        return result;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MiniRustParser, ASTNode };
}

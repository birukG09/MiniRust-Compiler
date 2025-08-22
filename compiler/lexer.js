/**
 * MiniRust Lexer
 * Tokenizes MiniRust source code into tokens for parsing
 */

class Token {
    constructor(type, value, line, column) {
        this.type = type;
        this.value = value;
        this.line = line;
        this.column = column;
    }

    toString() {
        return `${this.type}(${this.value}) at ${this.line}:${this.column}`;
    }
}

class MiniRustLexer {
    constructor() {
        this.keywords = new Set([
            'fn', 'let', 'mut', 'if', 'else', 'while', 'for', 'loop',
            'break', 'continue', 'return', 'true', 'false', 'print'
        ]);

        this.types = new Set([
            'i32', 'f64', 'bool', 'str'
        ]);

        this.operators = new Map([
            ['+', 'PLUS'],
            ['-', 'MINUS'],
            ['*', 'MULTIPLY'],
            ['/', 'DIVIDE'],
            ['%', 'MODULO'],
            ['=', 'ASSIGN'],
            ['==', 'EQUAL'],
            ['!=', 'NOT_EQUAL'],
            ['<', 'LESS_THAN'],
            ['<=', 'LESS_EQUAL'],
            ['>', 'GREATER_THAN'],
            ['>=', 'GREATER_EQUAL'],
            ['&&', 'LOGICAL_AND'],
            ['||', 'LOGICAL_OR'],
            ['!', 'LOGICAL_NOT'],
            ['&', 'BORROW'],
            ['&mut', 'BORROW_MUT']
        ]);

        this.delimiters = new Map([
            ['(', 'LEFT_PAREN'],
            [')', 'RIGHT_PAREN'],
            ['{', 'LEFT_BRACE'],
            ['}', 'RIGHT_BRACE'],
            ['[', 'LEFT_BRACKET'],
            [']', 'RIGHT_BRACKET'],
            [';', 'SEMICOLON'],
            [':', 'COLON'],
            [',', 'COMMA'],
            ['->', 'ARROW']
        ]);
    }

    tokenize(source) {
        this.source = source;
        this.position = 0;
        this.line = 1;
        this.column = 1;
        this.tokens = [];
        this.errors = [];

        while (this.position < this.source.length) {
            this.skipWhitespace();
            
            if (this.position >= this.source.length) {
                break;
            }

            const char = this.current();

            try {
                if (this.isAlpha(char) || char === '_') {
                    this.readIdentifierOrKeyword();
                } else if (this.isDigit(char)) {
                    this.readNumber();
                } else if (char === '"') {
                    this.readString();
                } else if (char === '/') {
                    if (this.peek() === '/') {
                        this.skipLineComment();
                    } else if (this.peek() === '*') {
                        this.skipBlockComment();
                    } else {
                        this.readOperator();
                    }
                } else if (this.isOperatorStart(char)) {
                    this.readOperator();
                } else if (this.isDelimiter(char)) {
                    this.readDelimiter();
                } else {
                    throw new Error(`Unexpected character: '${char}'`);
                }
            } catch (error) {
                this.errors.push({
                    type: 'LexicalError',
                    message: error.message,
                    line: this.line,
                    column: this.column
                });
                this.advance(); // Skip the problematic character
            }
        }

        this.tokens.push(new Token('EOF', null, this.line, this.column));
        return {
            tokens: this.tokens,
            errors: this.errors
        };
    }

    current() {
        return this.position < this.source.length ? this.source[this.position] : '\0';
    }

    peek(offset = 1) {
        const pos = this.position + offset;
        return pos < this.source.length ? this.source[pos] : '\0';
    }

    advance() {
        if (this.position < this.source.length) {
            if (this.source[this.position] === '\n') {
                this.line++;
                this.column = 1;
            } else {
                this.column++;
            }
            this.position++;
        }
    }

    skipWhitespace() {
        while (this.position < this.source.length) {
            const char = this.current();
            if (char === ' ' || char === '\t' || char === '\r' || char === '\n') {
                this.advance();
            } else {
                break;
            }
        }
    }

    skipLineComment() {
        // Skip '//'
        this.advance();
        this.advance();
        
        while (this.current() !== '\n' && this.current() !== '\0') {
            this.advance();
        }
    }

    skipBlockComment() {
        // Skip '/*'
        this.advance();
        this.advance();
        
        while (this.position < this.source.length - 1) {
            if (this.current() === '*' && this.peek() === '/') {
                this.advance(); // Skip '*'
                this.advance(); // Skip '/'
                break;
            }
            this.advance();
        }
    }

    readIdentifierOrKeyword() {
        const startLine = this.line;
        const startColumn = this.column;
        let value = '';

        while (this.isAlphaNumeric(this.current()) || this.current() === '_') {
            value += this.current();
            this.advance();
        }

        let tokenType;
        if (this.keywords.has(value)) {
            tokenType = 'KEYWORD';
        } else if (this.types.has(value)) {
            tokenType = 'TYPE';
        } else {
            tokenType = 'IDENTIFIER';
        }

        this.tokens.push(new Token(tokenType, value, startLine, startColumn));
    }

    readNumber() {
        const startLine = this.line;
        const startColumn = this.column;
        let value = '';
        let isFloat = false;

        while (this.isDigit(this.current())) {
            value += this.current();
            this.advance();
        }

        // Check for decimal point
        if (this.current() === '.' && this.isDigit(this.peek())) {
            isFloat = true;
            value += this.current();
            this.advance();

            while (this.isDigit(this.current())) {
                value += this.current();
                this.advance();
            }
        }

        const tokenType = isFloat ? 'FLOAT' : 'INTEGER';
        this.tokens.push(new Token(tokenType, value, startLine, startColumn));
    }

    readString() {
        const startLine = this.line;
        const startColumn = this.column;
        let value = '';

        this.advance(); // Skip opening quote

        while (this.current() !== '"' && this.current() !== '\0') {
            if (this.current() === '\\') {
                this.advance();
                const escaped = this.current();
                switch (escaped) {
                    case 'n': value += '\n'; break;
                    case 't': value += '\t'; break;
                    case 'r': value += '\r'; break;
                    case '\\': value += '\\'; break;
                    case '"': value += '"'; break;
                    default: value += escaped; break;
                }
                this.advance();
            } else {
                value += this.current();
                this.advance();
            }
        }

        if (this.current() === '"') {
            this.advance(); // Skip closing quote
            this.tokens.push(new Token('STRING', value, startLine, startColumn));
        } else {
            throw new Error('Unterminated string literal');
        }
    }

    readOperator() {
        const startLine = this.line;
        const startColumn = this.column;
        let value = '';

        // Try to match two-character operators first
        const twoChar = this.current() + this.peek();
        if (this.operators.has(twoChar)) {
            value = twoChar;
            this.advance();
            this.advance();
        } else if (this.operators.has(this.current())) {
            value = this.current();
            this.advance();
        } else {
            throw new Error(`Invalid operator: '${this.current()}'`);
        }

        const tokenType = this.operators.get(value);
        this.tokens.push(new Token(tokenType, value, startLine, startColumn));
    }

    readDelimiter() {
        const startLine = this.line;
        const startColumn = this.column;
        let value = '';

        // Try to match two-character delimiters first (like ->)
        const twoChar = this.current() + this.peek();
        if (this.delimiters.has(twoChar)) {
            value = twoChar;
            this.advance();
            this.advance();
        } else if (this.delimiters.has(this.current())) {
            value = this.current();
            this.advance();
        } else {
            throw new Error(`Invalid delimiter: '${this.current()}'`);
        }

        const tokenType = this.delimiters.get(value);
        this.tokens.push(new Token(tokenType, value, startLine, startColumn));
    }

    isAlpha(char) {
        return (char >= 'a' && char <= 'z') || (char >= 'A' && char <= 'Z');
    }

    isDigit(char) {
        return char >= '0' && char <= '9';
    }

    isAlphaNumeric(char) {
        return this.isAlpha(char) || this.isDigit(char);
    }

    isOperatorStart(char) {
        return '+-*/%=!<>&|'.includes(char);
    }

    isDelimiter(char) {
        return '(){}[];:,'.includes(char) || 
               (char === '-' && this.peek() === '>');
    }

    // Helper method to format tokens for display
    static formatTokensForDisplay(tokens) {
        return tokens.map(token => ({
            type: token.type,
            value: token.value,
            position: `${token.line}:${token.column}`
        }));
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MiniRustLexer, Token };
}

/**
 * MiniRust IR Generator
 * Generates LLVM-like Intermediate Representation from AST
 */

class IRInstruction {
    constructor(opcode, result = null, operands = [], type = null) {
        this.opcode = opcode;
        this.result = result;
        this.operands = operands;
        this.type = type;
        this.comment = null;
    }

    setComment(comment) {
        this.comment = comment;
        return this;
    }

    toString() {
        let str = '';
        
        if (this.result) {
            str += `  ${this.result} = `;
        } else {
            str += '  ';
        }
        
        str += this.opcode;
        
        if (this.type) {
            str += ` ${this.type}`;
        }
        
        if (this.operands.length > 0) {
            str += ` ${this.operands.join(', ')}`;
        }
        
        if (this.comment) {
            str += ` ; ${this.comment}`;
        }
        
        return str;
    }
}

class IRBasicBlock {
    constructor(name) {
        this.name = name;
        this.instructions = [];
        this.terminated = false;
    }

    addInstruction(instruction) {
        if (!this.terminated) {
            this.instructions.push(instruction);
            
            // Check if this instruction terminates the block
            if (['br', 'ret', 'br_cond'].includes(instruction.opcode)) {
                this.terminated = true;
            }
        }
        return instruction;
    }

    toString() {
        let str = `${this.name}:\n`;
        for (const instruction of this.instructions) {
            str += instruction.toString() + '\n';
        }
        return str;
    }
}

class IRFunction {
    constructor(name, returnType = 'void', parameters = []) {
        this.name = name;
        this.returnType = returnType;
        this.parameters = parameters;
        this.basicBlocks = [];
        this.currentBlock = null;
        this.nextBlockId = 0;
        this.nextTempId = 0;
    }

    createBasicBlock(name = null) {
        if (!name) {
            name = `bb${this.nextBlockId++}`;
        }
        const block = new IRBasicBlock(name);
        this.basicBlocks.push(block);
        return block;
    }

    setCurrentBlock(block) {
        this.currentBlock = block;
    }

    addInstruction(instruction) {
        if (this.currentBlock) {
            return this.currentBlock.addInstruction(instruction);
        }
        return instruction;
    }

    getNextTemp(prefix = 't') {
        return `%${prefix}${this.nextTempId++}`;
    }

    toString() {
        let paramStr = this.parameters.map(p => `${p.type} %${p.name}`).join(', ');
        let str = `define ${this.returnType} @${this.name}(${paramStr}) {\n`;
        
        for (const block of this.basicBlocks) {
            str += block.toString();
        }
        
        str += '}\n';
        return str;
    }
}

class MiniRustIRGenerator {
    constructor() {
        this.functions = [];
        this.currentFunction = null;
        this.globalDeclarations = [];
        this.stringLiterals = new Map();
        this.nextStringId = 0;
        this.variables = new Map(); // Maps variable names to IR values
        this.errors = [];
    }

    generate(ast, optimizations = false) {
        this.functions = [];
        this.currentFunction = null;
        this.globalDeclarations = [];
        this.stringLiterals = new Map();
        this.nextStringId = 0;
        this.variables = new Map();
        this.errors = [];

        try {
            // Generate IR for the AST
            this.visitNode(ast);
            
            // Apply optimizations if requested
            if (optimizations) {
                this.applyOptimizations();
            }
            
            // Generate the complete IR module
            const ir = this.generateModule();
            
            return {
                ir: ir,
                errors: this.errors,
                success: this.errors.length === 0
            };
        } catch (error) {
            this.errors.push({
                type: 'IRGenerationError',
                message: error.message,
                line: 0,
                column: 0
            });
            
            return {
                ir: '; IR generation failed\n',
                errors: this.errors,
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
            case 'Assignment':
                return this.visitAssignment(node);
            case 'IfStatement':
                return this.visitIfStatement(node);
            case 'WhileStatement':
                return this.visitWhileStatement(node);
            case 'Block':
                return this.visitBlock(node);
            case 'BinaryOperation':
                return this.visitBinaryOperation(node);
            case 'UnaryOperation':
                return this.visitUnaryOperation(node);
            case 'Identifier':
                return this.visitIdentifier(node);
            case 'IntegerLiteral':
                return { value: node.value.toString(), type: 'i32' };
            case 'FloatLiteral':
                return { value: node.value.toString(), type: 'double' };
            case 'StringLiteral':
                return this.visitStringLiteral(node);
            case 'BooleanLiteral':
                return { value: node.value ? '1' : '0', type: 'i1' };
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
        const returnType = this.mapTypeToLLVM(returnTypeNode ? returnTypeNode.value : 'void');
        
        // Process parameters
        const parameters = [];
        if (paramsNode) {
            for (const paramNode of paramsNode.children) {
                const paramNameNode = paramNode.children.find(child => child.type === 'ParameterName');
                const paramTypeNode = paramNode.children.find(child => child.type === 'ParameterType');
                
                parameters.push({
                    name: paramNameNode.value,
                    type: this.mapTypeToLLVM(paramTypeNode.value)
                });
            }
        }

        // Create new function
        const irFunction = new IRFunction(functionName, returnType, parameters);
        this.functions.push(irFunction);
        this.currentFunction = irFunction;

        // Create entry block
        const entryBlock = irFunction.createBasicBlock('entry');
        irFunction.setCurrentBlock(entryBlock);

        // Add parameters to variable map
        for (const param of parameters) {
            this.variables.set(param.name, {
                value: `%${param.name}`,
                type: param.type,
                isParameter: true
            });
        }

        // Generate function body
        this.visitNode(bodyNode);

        // Ensure function has a return
        if (!irFunction.currentBlock.terminated) {
            if (returnType === 'void') {
                irFunction.addInstruction(new IRInstruction('ret', null, ['void']));
            } else {
                // Add default return value
                const defaultValue = this.getDefaultValue(returnType);
                irFunction.addInstruction(new IRInstruction('ret', null, [returnType, defaultValue]));
            }
        }

        this.currentFunction = null;
        return null;
    }

    visitVariableDeclaration(node) {
        const nameNode = node.children.find(child => child.type === 'VariableName');
        const mutabilityNode = node.children.find(child => child.type === 'Mutable');
        const typeNode = node.children.find(child => child.type === 'VariableType');
        const initValueNode = node.children.find(child => 
            !['VariableName', 'Mutable', 'VariableType'].includes(child.type)
        );

        const variableName = nameNode.value;
        const variableType = this.mapTypeToLLVM(typeNode ? typeNode.value : 'i32');
        
        // Allocate space for the variable
        const allocaResult = this.currentFunction.getNextTemp('alloca');
        const allocaInstr = new IRInstruction('alloca', allocaResult, [variableType])
            .setComment(`Variable: ${variableName}`);
        this.currentFunction.addInstruction(allocaInstr);

        // Store initial value if provided
        if (initValueNode) {
            const initValue = this.visitNode(initValueNode);
            if (initValue) {
                const storeInstr = new IRInstruction('store', null, [
                    variableType, initValue.value, `${variableType}*`, allocaResult
                ]);
                this.currentFunction.addInstruction(storeInstr);
            }
        } else {
            // Initialize with default value
            const defaultValue = this.getDefaultValue(variableType);
            const storeInstr = new IRInstruction('store', null, [
                variableType, defaultValue, `${variableType}*`, allocaResult
            ]);
            this.currentFunction.addInstruction(storeInstr);
        }

        // Add to variable map
        this.variables.set(variableName, {
            value: allocaResult,
            type: `${variableType}*`,
            elementType: variableType,
            isAlloca: true
        });

        return null;
    }

    visitAssignment(node) {
        const leftNode = node.children[0];
        const rightValue = this.visitNode(node.children[1]);

        if (leftNode.type === 'Identifier' && rightValue) {
            const variableName = leftNode.value;
            const variable = this.variables.get(variableName);
            
            if (variable && variable.isAlloca) {
                const storeInstr = new IRInstruction('store', null, [
                    variable.elementType, rightValue.value, variable.type, variable.value
                ]);
                this.currentFunction.addInstruction(storeInstr);
            }
        }

        return rightValue;
    }

    visitBinaryOperation(node) {
        const leftValue = this.visitNode(node.children[0]);
        const rightValue = this.visitNode(node.children[1]);
        const operator = node.value;

        if (!leftValue || !rightValue) {
            return null;
        }

        const resultTemp = this.currentFunction.getNextTemp();
        let opcode;
        let resultType = leftValue.type;

        switch (operator) {
            case '+':
                opcode = leftValue.type === 'double' ? 'fadd' : 'add';
                break;
            case '-':
                opcode = leftValue.type === 'double' ? 'fsub' : 'sub';
                break;
            case '*':
                opcode = leftValue.type === 'double' ? 'fmul' : 'mul';
                break;
            case '/':
                opcode = leftValue.type === 'double' ? 'fdiv' : 'sdiv';
                break;
            case '%':
                opcode = 'srem'; // Integer remainder only
                break;
            case '<':
                opcode = leftValue.type === 'double' ? 'fcmp olt' : 'icmp slt';
                resultType = 'i1';
                break;
            case '<=':
                opcode = leftValue.type === 'double' ? 'fcmp ole' : 'icmp sle';
                resultType = 'i1';
                break;
            case '>':
                opcode = leftValue.type === 'double' ? 'fcmp ogt' : 'icmp sgt';
                resultType = 'i1';
                break;
            case '>=':
                opcode = leftValue.type === 'double' ? 'fcmp oge' : 'icmp sge';
                resultType = 'i1';
                break;
            case '==':
                opcode = leftValue.type === 'double' ? 'fcmp oeq' : 'icmp eq';
                resultType = 'i1';
                break;
            case '!=':
                opcode = leftValue.type === 'double' ? 'fcmp one' : 'icmp ne';
                resultType = 'i1';
                break;
            case '&&':
                opcode = 'and';
                resultType = 'i1';
                break;
            case '||':
                opcode = 'or';
                resultType = 'i1';
                break;
            default:
                throw new Error(`Unsupported binary operator: ${operator}`);
        }

        const instruction = new IRInstruction(opcode, resultTemp, [
            leftValue.type, leftValue.value + ',', rightValue.value
        ], resultType);

        this.currentFunction.addInstruction(instruction);

        return { value: resultTemp, type: resultType };
    }

    visitUnaryOperation(node) {
        const operandValue = this.visitNode(node.children[0]);
        const operator = node.value;

        if (!operandValue) {
            return null;
        }

        const resultTemp = this.currentFunction.getNextTemp();
        let opcode;
        let resultType = operandValue.type;

        switch (operator) {
            case '-':
                if (operandValue.type === 'double') {
                    opcode = 'fsub';
                    this.currentFunction.addInstruction(new IRInstruction(opcode, resultTemp, [
                        'double', '0.0,', operandValue.value
                    ], 'double'));
                } else {
                    opcode = 'sub';
                    this.currentFunction.addInstruction(new IRInstruction(opcode, resultTemp, [
                        'i32', '0,', operandValue.value
                    ], 'i32'));
                }
                break;
            case '!':
                opcode = 'xor';
                this.currentFunction.addInstruction(new IRInstruction(opcode, resultTemp, [
                    'i1', operandValue.value + ',', '1'
                ], 'i1'));
                break;
            default:
                return operandValue; // For borrowing operations, just pass through
        }

        return { value: resultTemp, type: resultType };
    }

    visitIdentifier(node) {
        const variableName = node.value;
        const variable = this.variables.get(variableName);

        if (variable) {
            if (variable.isAlloca) {
                // Load the value from memory
                const loadTemp = this.currentFunction.getNextTemp('load');
                const loadInstr = new IRInstruction('load', loadTemp, [
                    variable.elementType, variable.type, variable.value
                ], variable.elementType);
                this.currentFunction.addInstruction(loadInstr);
                
                return { value: loadTemp, type: variable.elementType };
            } else {
                // Direct value (parameter)
                return { value: variable.value, type: variable.type };
            }
        }

        throw new Error(`Undefined variable: ${variableName}`);
    }

    visitStringLiteral(node) {
        const stringValue = node.value;
        let stringId;
        
        if (this.stringLiterals.has(stringValue)) {
            stringId = this.stringLiterals.get(stringValue);
        } else {
            stringId = this.nextStringId++;
            this.stringLiterals.set(stringValue, stringId);
        }

        return { 
            value: `@.str.${stringId}`, 
            type: `[${stringValue.length + 1} x i8]*`,
            stringValue: stringValue
        };
    }

    visitPrintStatement(node) {
        const argValue = this.visitNode(node.children[0]);
        
        if (argValue) {
            // For simplicity, we'll generate a call to a hypothetical print function
            const callInstr = new IRInstruction('call', null, [
                'void', '@print', `(${argValue.type}`, `${argValue.value})`
            ]).setComment('Print statement');
            
            this.currentFunction.addInstruction(callInstr);
        }

        return null;
    }

    visitReturnStatement(node) {
        if (node.children.length > 0) {
            const returnValue = this.visitNode(node.children[0]);
            if (returnValue) {
                const retInstr = new IRInstruction('ret', null, [returnValue.type, returnValue.value]);
                this.currentFunction.addInstruction(retInstr);
            }
        } else {
            const retInstr = new IRInstruction('ret', null, ['void']);
            this.currentFunction.addInstruction(retInstr);
        }

        return null;
    }

    visitIfStatement(node) {
        const conditionValue = this.visitNode(node.children[0]);
        
        if (!conditionValue) {
            return null;
        }

        // Create basic blocks
        const thenBlock = this.currentFunction.createBasicBlock('if.then');
        const elseBlock = this.currentFunction.createBasicBlock('if.else');
        const endBlock = this.currentFunction.createBasicBlock('if.end');

        // Generate conditional branch
        const brInstr = new IRInstruction('br', null, [
            'i1', conditionValue.value + ',', 'label', `%${thenBlock.name},`, 'label', `%${elseBlock.name}`
        ], null);
        this.currentFunction.addInstruction(brInstr);

        // Generate then block
        this.currentFunction.setCurrentBlock(thenBlock);
        this.visitNode(node.children[1]); // then branch
        
        if (!thenBlock.terminated) {
            this.currentFunction.addInstruction(new IRInstruction('br', null, ['label', `%${endBlock.name}`]));
        }

        // Generate else block
        this.currentFunction.setCurrentBlock(elseBlock);
        if (node.children[2]) {
            this.visitNode(node.children[2]); // else branch
        }
        
        if (!elseBlock.terminated) {
            this.currentFunction.addInstruction(new IRInstruction('br', null, ['label', `%${endBlock.name}`]));
        }

        // Continue with end block
        this.currentFunction.setCurrentBlock(endBlock);

        return null;
    }

    visitWhileStatement(node) {
        const loopHeader = this.currentFunction.createBasicBlock('while.header');
        const loopBody = this.currentFunction.createBasicBlock('while.body');
        const loopEnd = this.currentFunction.createBasicBlock('while.end');

        // Branch to loop header
        this.currentFunction.addInstruction(new IRInstruction('br', null, ['label', `%${loopHeader.name}`]));

        // Generate loop header (condition check)
        this.currentFunction.setCurrentBlock(loopHeader);
        const conditionValue = this.visitNode(node.children[0]);
        
        if (conditionValue) {
            const brInstr = new IRInstruction('br', null, [
                'i1', conditionValue.value + ',', 'label', `%${loopBody.name},`, 'label', `%${loopEnd.name}`
            ]);
            this.currentFunction.addInstruction(brInstr);
        }

        // Generate loop body
        this.currentFunction.setCurrentBlock(loopBody);
        this.visitNode(node.children[1]);
        
        if (!loopBody.terminated) {
            this.currentFunction.addInstruction(new IRInstruction('br', null, ['label', `%${loopHeader.name}`]));
        }

        // Continue with end block
        this.currentFunction.setCurrentBlock(loopEnd);

        return null;
    }

    visitBlock(node) {
        for (const child of node.children) {
            this.visitNode(child);
        }
        return null;
    }

    // Helper methods
    mapTypeToLLVM(rustType) {
        switch (rustType) {
            case 'i32': return 'i32';
            case 'f64': return 'double';
            case 'bool': return 'i1';
            case 'str': return 'i8*';
            case 'void': return 'void';
            default: return 'i32'; // Default fallback
        }
    }

    getDefaultValue(llvmType) {
        switch (llvmType) {
            case 'i32': return '0';
            case 'double': return '0.0';
            case 'i1': return '0';
            case 'i8*': return 'null';
            default: return '0';
        }
    }

    applyOptimizations() {
        // Apply basic optimizations
        for (const func of this.functions) {
            this.constantFolding(func);
            this.deadCodeElimination(func);
        }
    }

    constantFolding(func) {
        // Simple constant folding optimization
        for (const block of func.basicBlocks) {
            const newInstructions = [];
            
            for (const instr of block.instructions) {
                // Look for arithmetic operations with constant operands
                if (['add', 'sub', 'mul'].includes(instr.opcode)) {
                    const operands = instr.operands[1].split(',').map(op => op.trim());
                    
                    if (operands.length === 2 && 
                        this.isConstant(operands[0]) && 
                        this.isConstant(operands[1])) {
                        
                        // Perform constant folding
                        const result = this.evaluateConstantOperation(instr.opcode, operands[0], operands[1]);
                        
                        // Replace with a simple assignment (in a real compiler, we'd track this better)
                        instr.setComment(`Constant folded: ${operands[0]} ${instr.opcode} ${operands[1]} = ${result}`);
                    }
                }
                
                newInstructions.push(instr);
            }
            
            block.instructions = newInstructions;
        }
    }

    deadCodeElimination(func) {
        // Mark all used values
        const usedValues = new Set();
        
        for (const block of func.basicBlocks) {
            for (const instr of block.instructions) {
                // Mark operands as used
                for (const operand of instr.operands) {
                    if (typeof operand === 'string' && operand.startsWith('%')) {
                        usedValues.add(operand);
                    }
                }
            }
        }

        // Remove unused instructions
        for (const block of func.basicBlocks) {
            block.instructions = block.instructions.filter(instr => {
                if (!instr.result) return true; // Keep instructions without results (side effects)
                return usedValues.has(instr.result); // Keep if result is used
            });
        }
    }

    isConstant(value) {
        return !value.startsWith('%') && !value.startsWith('@');
    }

    evaluateConstantOperation(opcode, left, right) {
        const leftVal = parseInt(left);
        const rightVal = parseInt(right);
        
        switch (opcode) {
            case 'add': return leftVal + rightVal;
            case 'sub': return leftVal - rightVal;
            case 'mul': return leftVal * rightVal;
            default: return left; // Fallback
        }
    }

    generateModule() {
        let ir = '; MiniRust Compiler - Generated LLVM IR\n\n';

        // Generate string literal declarations
        this.stringLiterals.forEach((id, value) => {
            const escapedValue = value.replace(/\n/g, '\\0A').replace(/\t/g, '\\09');
            ir += `@.str.${id} = private unnamed_addr constant [${value.length + 1} x i8] c"${escapedValue}\\00"\n`;
        });

        if (this.stringLiterals.size > 0) {
            ir += '\n';
        }

        // External function declarations
        ir += '; External function declarations\n';
        ir += 'declare void @print(i32)\n';
        ir += 'declare void @print(double)\n';
        ir += 'declare void @print(i8*)\n\n';

        // Generate function definitions
        for (const func of this.functions) {
            ir += func.toString();
            ir += '\n';
        }

        return ir;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MiniRustIRGenerator };
}

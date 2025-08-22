/**
 * MiniRust Error Reporter
 * Formats and displays compilation errors and warnings
 */

class MiniRustErrorReporter {
    constructor() {
        this.errors = [];
        this.warnings = [];
    }

    static formatError(error, sourceCode = null) {
        const errorDiv = document.createElement('div');
        
        // Determine error class based on type
        let errorClass = 'error-message';
        if (error.type && error.type.toLowerCase().includes('warning')) {
            errorClass = 'warning-message';
        }
        
        errorDiv.className = errorClass;
        
        // Create error header
        const header = document.createElement('div');
        header.style.fontWeight = 'bold';
        header.style.marginBottom = '8px';
        
        const icon = MiniRustErrorReporter.getErrorIcon(error.type);
        const location = error.line && error.column ? ` at line ${error.line}, column ${error.column}` : '';
        
        header.innerHTML = `${icon} ${error.type || 'Error'}${location}`;
        errorDiv.appendChild(header);
        
        // Create error message
        const messageDiv = document.createElement('div');
        messageDiv.style.marginBottom = '8px';
        messageDiv.textContent = error.message;
        errorDiv.appendChild(messageDiv);
        
        // Add source context if available
        if (sourceCode && error.line) {
            const contextDiv = MiniRustErrorReporter.createSourceContext(sourceCode, error.line, error.column);
            if (contextDiv) {
                errorDiv.appendChild(contextDiv);
            }
        }
        
        // Add suggestions if available
        if (error.suggestion) {
            const suggestionDiv = document.createElement('div');
            suggestionDiv.style.marginTop = '8px';
            suggestionDiv.style.padding = '8px';
            suggestionDiv.style.backgroundColor = '#e8f4fd';
            suggestionDiv.style.borderLeft = '4px solid #007bff';
            suggestionDiv.style.borderRadius = '4px';
            suggestionDiv.innerHTML = `<strong>Suggestion:</strong> ${error.suggestion}`;
            errorDiv.appendChild(suggestionDiv);
        }
        
        return errorDiv;
    }

    static getErrorIcon(errorType) {
        const icons = {
            'LexicalError': '<i class="fas fa-times-circle" style="color: #dc3545;"></i>',
            'ParseError': '<i class="fas fa-exclamation-triangle" style="color: #ffc107;"></i>',
            'SemanticError': '<i class="fas fa-bug" style="color: #dc3545;"></i>',
            'TypeError': '<i class="fas fa-code" style="color: #dc3545;"></i>',
            'OwnershipError': '<i class="fas fa-lock" style="color: #dc3545;"></i>',
            'UnusedVariable': '<i class="fas fa-info-circle" style="color: #17a2b8;"></i>',
            'IRGenerationError': '<i class="fas fa-cogs" style="color: #dc3545;"></i>',
            'Warning': '<i class="fas fa-exclamation-triangle" style="color: #ffc107;"></i>'
        };
        
        return icons[errorType] || '<i class="fas fa-exclamation-circle" style="color: #dc3545;"></i>';
    }

    static createSourceContext(sourceCode, errorLine, errorColumn) {
        const lines = sourceCode.split('\n');
        
        if (errorLine < 1 || errorLine > lines.length) {
            return null;
        }
        
        const contextDiv = document.createElement('div');
        contextDiv.style.fontFamily = 'monospace';
        contextDiv.style.fontSize = '12px';
        contextDiv.style.backgroundColor = '#f8f9fa';
        contextDiv.style.border = '1px solid #dee2e6';
        contextDiv.style.borderRadius = '4px';
        contextDiv.style.padding = '8px';
        contextDiv.style.marginTop = '8px';
        
        // Show context lines (line before, error line, line after)
        const startLine = Math.max(1, errorLine - 1);
        const endLine = Math.min(lines.length, errorLine + 1);
        
        for (let lineNum = startLine; lineNum <= endLine; lineNum++) {
            const lineDiv = document.createElement('div');
            lineDiv.style.display = 'flex';
            lineDiv.style.marginBottom = '2px';
            
            // Line number
            const lineNumberSpan = document.createElement('span');
            lineNumberSpan.textContent = lineNum.toString().padStart(3, ' ') + ' | ';
            lineNumberSpan.style.color = '#6c757d';
            lineNumberSpan.style.marginRight = '8px';
            lineDiv.appendChild(lineNumberSpan);
            
            // Line content
            const lineContentSpan = document.createElement('span');
            const lineContent = lines[lineNum - 1] || '';
            
            if (lineNum === errorLine) {
                lineDiv.style.backgroundColor = '#fff3cd';
                lineDiv.style.fontWeight = 'bold';
                
                // Highlight the error column if specified
                if (errorColumn && errorColumn <= lineContent.length) {
                    const beforeError = lineContent.substring(0, errorColumn - 1);
                    const errorChar = lineContent.charAt(errorColumn - 1) || ' ';
                    const afterError = lineContent.substring(errorColumn);
                    
                    lineContentSpan.innerHTML = 
                        MiniRustErrorReporter.escapeHtml(beforeError) +
                        '<span style="background-color: #dc3545; color: white; padding: 0 2px;">' +
                        MiniRustErrorReporter.escapeHtml(errorChar) +
                        '</span>' +
                        MiniRustErrorReporter.escapeHtml(afterError);
                } else {
                    lineContentSpan.textContent = lineContent;
                }
            } else {
                lineContentSpan.textContent = lineContent;
            }
            
            lineDiv.appendChild(lineContentSpan);
            contextDiv.appendChild(lineDiv);
        }
        
        // Add error pointer if column is specified
        if (errorColumn) {
            const pointerDiv = document.createElement('div');
            pointerDiv.style.display = 'flex';
            pointerDiv.style.color = '#dc3545';
            pointerDiv.style.fontWeight = 'bold';
            
            const paddingSpan = document.createElement('span');
            paddingSpan.textContent = '    | '; // Match line number padding
            paddingSpan.style.color = 'transparent';
            pointerDiv.appendChild(paddingSpan);
            
            const arrowSpan = document.createElement('span');
            arrowSpan.textContent = ' '.repeat(Math.max(0, errorColumn - 1)) + '^';
            arrowSpan.style.color = '#dc3545';
            pointerDiv.appendChild(arrowSpan);
            
            contextDiv.appendChild(pointerDiv);
        }
        
        return contextDiv;
    }

    static escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    static displayErrors(errors, warnings, container, sourceCode = null) {
        container.innerHTML = '';
        
        if (errors.length === 0 && warnings.length === 0) {
            const successDiv = document.createElement('div');
            successDiv.className = 'success-message';
            successDiv.innerHTML = '<i class="fas fa-check-circle"></i> No errors found! ✨';
            container.appendChild(successDiv);
            return;
        }
        
        // Display errors
        for (const error of errors) {
            const errorElement = MiniRustErrorReporter.formatError(error, sourceCode);
            container.appendChild(errorElement);
        }
        
        // Display warnings
        for (const warning of warnings) {
            const warningElement = MiniRustErrorReporter.formatError(warning, sourceCode);
            container.appendChild(warningElement);
        }
        
        // Add summary
        const summaryDiv = document.createElement('div');
        summaryDiv.style.marginTop = '16px';
        summaryDiv.style.padding = '12px';
        summaryDiv.style.backgroundColor = '#f8f9fa';
        summaryDiv.style.border = '1px solid #dee2e6';
        summaryDiv.style.borderRadius = '4px';
        summaryDiv.style.textAlign = 'center';
        
        const errorCount = errors.length;
        const warningCount = warnings.length;
        
        let summaryText = '';
        if (errorCount > 0) {
            summaryText += `${errorCount} error${errorCount !== 1 ? 's' : ''}`;
        }
        if (warningCount > 0) {
            if (summaryText) summaryText += ', ';
            summaryText += `${warningCount} warning${warningCount !== 1 ? 's' : ''}`;
        }
        
        summaryDiv.innerHTML = `<strong>Compilation Summary:</strong> ${summaryText}`;
        
        if (errorCount > 0) {
            summaryDiv.style.backgroundColor = '#f8d7da';
            summaryDiv.style.borderColor = '#dc3545';
        } else if (warningCount > 0) {
            summaryDiv.style.backgroundColor = '#fff3cd';
            summaryDiv.style.borderColor = '#ffc107';
        }
        
        container.appendChild(summaryDiv);
    }

    static createCompilerDiagnostic(stage, message, type = 'info') {
        return {
            type: type.charAt(0).toUpperCase() + type.slice(1),
            message: `[${stage}] ${message}`,
            line: null,
            column: null
        };
    }

    static enhanceErrorWithSuggestions(error) {
        const suggestions = {
            "Undefined variable": "Make sure the variable is declared with 'let' before using it.",
            "Type mismatch": "Check that the types on both sides of the assignment are compatible.",
            "Cannot assign to immutable variable": "Add 'mut' after 'let' to make the variable mutable: 'let mut variable_name'.",
            "Unterminated string literal": "Make sure to close string literals with a matching quote.",
            "Expected": "Check your syntax - you might be missing a semicolon, parenthesis, or brace.",
            "Cannot create mutable borrow": "Only one mutable borrow is allowed at a time. Consider restructuring your code.",
            "already borrowed": "Variables cannot be borrowed mutably while they have other borrows active."
        };
        
        for (const [keyword, suggestion] of Object.entries(suggestions)) {
            if (error.message.includes(keyword)) {
                error.suggestion = suggestion;
                break;
            }
        }
        
        return error;
    }

    static formatCompilationPipeline(stages) {
        const pipelineDiv = document.createElement('div');
        pipelineDiv.style.marginBottom = '16px';
        
        const titleDiv = document.createElement('div');
        titleDiv.innerHTML = '<h6><i class="fas fa-list-ol"></i> Compilation Pipeline</h6>';
        pipelineDiv.appendChild(titleDiv);
        
        const stagesDiv = document.createElement('div');
        stagesDiv.style.display = 'flex';
        stagesDiv.style.flexWrap = 'wrap';
        stagesDiv.style.gap = '8px';
        
        stages.forEach((stage, index) => {
            const stageDiv = document.createElement('div');
            stageDiv.style.padding = '4px 8px';
            stageDiv.style.borderRadius = '4px';
            stageDiv.style.fontSize = '12px';
            stageDiv.style.fontWeight = 'bold';
            
            if (stage.completed) {
                stageDiv.style.backgroundColor = '#d4edda';
                stageDiv.style.color = '#155724';
                stageDiv.innerHTML = `<i class="fas fa-check"></i> ${stage.name}`;
            } else if (stage.error) {
                stageDiv.style.backgroundColor = '#f8d7da';
                stageDiv.style.color = '#721c24';
                stageDiv.innerHTML = `<i class="fas fa-times"></i> ${stage.name}`;
            } else {
                stageDiv.style.backgroundColor = '#fff3cd';
                stageDiv.style.color = '#856404';
                stageDiv.innerHTML = `<i class="fas fa-clock"></i> ${stage.name}`;
            }
            
            stagesDiv.appendChild(stageDiv);
            
            // Add arrow between stages
            if (index < stages.length - 1) {
                const arrowDiv = document.createElement('div');
                arrowDiv.innerHTML = '<i class="fas fa-arrow-right" style="color: #6c757d;"></i>';
                arrowDiv.style.display = 'flex';
                arrowDiv.style.alignItems = 'center';
                stagesDiv.appendChild(arrowDiv);
            }
        });
        
        pipelineDiv.appendChild(stagesDiv);
        return pipelineDiv;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MiniRustErrorReporter };
}

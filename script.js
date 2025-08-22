/**
 * MiniRust Compiler - Main Application Script
 * Coordinates the compilation pipeline and manages the user interface
 */

class MiniRustCompilerApp {
    constructor() {
        this.lexer = new MiniRustLexer();
        this.parser = new MiniRustParser();
        this.semanticAnalyzer = new MiniRustSemanticAnalyzer();
        this.irGenerator = new MiniRustIRGenerator();
        
        this.currentSourceCode = '';
        this.compilationResults = {
            tokens: null,
            ast: null,
            semantic: null,
            ir: null,
            errors: [],
            warnings: []
        };
        
        this.initializeEventHandlers();
        this.loadDefaultExample();
    }

    initializeEventHandlers() {
        // Compile button
        const compileBtn = document.getElementById('compileBtn');
        if (compileBtn) {
            compileBtn.addEventListener('click', () => this.compileCode());
        }

        // Load example button
        const loadExampleBtn = document.getElementById('loadExample');
        if (loadExampleBtn) {
            loadExampleBtn.addEventListener('click', () => this.showExampleMenu());
        }

        // Clear code button
        const clearCodeBtn = document.getElementById('clearCode');
        if (clearCodeBtn) {
            clearCodeBtn.addEventListener('click', () => this.clearCode());
        }

        // Source code textarea change handler
        const sourceCodeTextarea = document.getElementById('sourceCode');
        if (sourceCodeTextarea) {
            sourceCodeTextarea.addEventListener('input', (event) => {
                this.currentSourceCode = event.target.value;
                this.updateLineNumbers();
                this.updateStatusBar();
                this.clearResults();
            });
            
            // Cursor position tracking
            sourceCodeTextarea.addEventListener('click', () => this.updateStatusBar());
            sourceCodeTextarea.addEventListener('keyup', () => this.updateStatusBar());
        }

        // Output tab handlers
        const outputTabs = document.querySelectorAll('.output-tab');
        outputTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                this.switchOutputTab(tab.dataset.target);
            });
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (event) => {
            // Ctrl+Enter or Cmd+Enter to compile
            if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
                event.preventDefault();
                this.compileCode();
            }
            
            // Ctrl+L or Cmd+L to load example
            if ((event.ctrlKey || event.metaKey) && event.key === 'l') {
                event.preventDefault();
                this.showExampleMenu();
            }
        });
        
        // Initialize line numbers and status bar after DOM is ready
        setTimeout(() => {
            this.updateLineNumbers();
            this.updateStatusBar();
        }, 0);
    }

    loadDefaultExample() {
        const defaultCode = `fn main() {
    let mut x: i32 = 10;
    let y: i32 = 20;
    
    if x < y {
        x = x + 5;
        print(x);
    }
    
    let mut i: i32 = 0;
    while i < 3 {
        print(i);
        i = i + 1;
    }
}`;

        this.setSourceCode(defaultCode);
    }

    setSourceCode(code) {
        this.currentSourceCode = code;
        const sourceCodeTextarea = document.getElementById('sourceCode');
        if (sourceCodeTextarea) {
            sourceCodeTextarea.value = code;
        }
        this.clearResults();
    }

    clearCode() {
        this.setSourceCode('');
    }

    clearResults() {
        this.compilationResults = {
            tokens: null,
            ast: null,
            semantic: null,
            ir: null,
            errors: [],
            warnings: []
        };
        
        // Clear all output displays
        this.clearOutputDisplays();
    }

    clearOutputDisplays() {
        const outputs = ['tokensOutput', 'astOutput', 'symbolTableOutput', 
                        'ownershipOutput', 'irOutput', 'errorsOutput'];
        
        outputs.forEach(outputId => {
            const element = document.getElementById(outputId);
            if (element) {
                element.textContent = '';
            }
        });
        
        // Clear badges
        const badges = ['tokensBadge', 'astBadge', 'semanticBadge', 'irBadge', 'errorsBadge'];
        badges.forEach(badgeId => {
            const badge = document.getElementById(badgeId);
            if (badge) {
                badge.textContent = '';
            }
        });
    }

    showExampleMenu() {
        const examples = getSampleProgramTitles();
        
        // Create and show modal
        const modal = this.createModal('Load Example Program', `
            ${examples.map(example => `
                <div class="example-item" onclick="app.loadExample('${example.key}'); app.closeModal();">
                    <h4>${example.title}</h4>
                    <p>${example.description}</p>
                </div>
            `).join('')}
        `);

        modal.show();
    }

    loadExample(key) {
        const example = getSampleProgram(key);
        if (example) {
            this.setSourceCode(example.code);
        }
    }

    createModal(title, content) {
        // Simple overlay modal for the new design
        const modalHtml = `
            <div class="modal-overlay" id="dynamicModal">
                <div class="modal-container">
                    <div class="modal-header">
                        <h3>${title}</h3>
                        <button class="modal-close" onclick="app.closeModal()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-content">
                        ${content}
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        // Add modal styles if not already present
        if (!document.getElementById('modalStyles')) {
            const modalStyles = `
                <style id="modalStyles">
                    .modal-overlay {
                        position: fixed;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        background: rgba(13, 17, 23, 0.8);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        z-index: 1000;
                    }
                    .modal-container {
                        background: var(--bg-secondary);
                        border: 1px solid var(--border-primary);
                        border-radius: var(--radius-lg);
                        width: 90%;
                        max-width: 600px;
                        max-height: 80vh;
                        overflow: hidden;
                        box-shadow: var(--shadow-xl);
                    }
                    .modal-header {
                        padding: 20px;
                        border-bottom: 1px solid var(--border-primary);
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                    }
                    .modal-header h3 {
                        margin: 0;
                        color: var(--text-primary);
                    }
                    .modal-close {
                        background: none;
                        border: none;
                        color: var(--text-secondary);
                        font-size: 16px;
                        cursor: pointer;
                        padding: 4px;
                        border-radius: var(--radius-sm);
                    }
                    .modal-close:hover {
                        background: var(--bg-tertiary);
                        color: var(--text-primary);
                    }
                    .modal-content {
                        padding: 20px;
                        max-height: 60vh;
                        overflow-y: auto;
                    }
                    .example-item {
                        padding: 16px;
                        border: 1px solid var(--border-primary);
                        border-radius: var(--radius-md);
                        margin-bottom: 12px;
                        cursor: pointer;
                        transition: all 0.2s;
                    }
                    .example-item:hover {
                        background: var(--bg-tertiary);
                        border-color: var(--accent-primary);
                    }
                    .example-item h4 {
                        margin: 0 0 8px 0;
                        color: var(--text-primary);
                        font-size: 16px;
                    }
                    .example-item p {
                        margin: 0;
                        color: var(--text-secondary);
                        font-size: 14px;
                    }
                </style>
            `;
            document.head.insertAdjacentHTML('beforeend', modalStyles);
        }
        
        return {
            show: () => document.getElementById('dynamicModal').style.display = 'flex'
        };
    }

    closeModal() {
        const modal = document.getElementById('dynamicModal');
        if (modal) {
            modal.remove();
        }
    }

    async compileCode() {
        if (!this.currentSourceCode.trim()) {
            this.showError('No code to compile. Please enter some MiniRust code.');
            return;
        }

        this.showCompilationStatus(true);
        this.clearResults();

        try {
            const pipeline = [
                { name: 'Lexical Analysis', completed: false, error: false },
                { name: 'Parsing', completed: false, error: false },
                { name: 'Semantic Analysis', completed: false, error: false },
                { name: 'IR Generation', completed: false, error: false }
            ];

            // Step 1: Lexical Analysis
            console.log('Starting lexical analysis...');
            const lexResult = this.lexer.tokenize(this.currentSourceCode);
            pipeline[0].completed = lexResult.errors.length === 0;
            pipeline[0].error = lexResult.errors.length > 0;
            
            this.compilationResults.tokens = lexResult.tokens;
            this.compilationResults.errors = [...this.compilationResults.errors, ...lexResult.errors];
            
            this.updateTokensDisplay(lexResult.tokens);
            
            if (lexResult.errors.length > 0) {
                throw new Error('Lexical analysis failed');
            }

            // Step 2: Parsing
            console.log('Starting parsing...');
            const parseResult = this.parser.parse(lexResult.tokens);
            pipeline[1].completed = parseResult.errors.length === 0 && parseResult.ast !== null;
            pipeline[1].error = parseResult.errors.length > 0 || parseResult.ast === null;
            
            this.compilationResults.ast = parseResult.ast;
            this.compilationResults.errors = [...this.compilationResults.errors, ...parseResult.errors];
            
            this.updateASTDisplay(parseResult.ast);
            
            if (parseResult.errors.length > 0 || !parseResult.ast) {
                throw new Error('Parsing failed');
            }

            // Step 3: Semantic Analysis
            console.log('Starting semantic analysis...');
            const checkOwnership = document.getElementById('checkOwnership').checked;
            const semanticResult = this.semanticAnalyzer.analyze(parseResult.ast, checkOwnership);
            pipeline[2].completed = semanticResult.errors.length === 0;
            pipeline[2].error = semanticResult.errors.length > 0;
            
            this.compilationResults.semantic = semanticResult;
            this.compilationResults.errors = [...this.compilationResults.errors, ...semanticResult.errors];
            this.compilationResults.warnings = [...this.compilationResults.warnings, ...semanticResult.warnings];
            
            this.updateSemanticDisplay(semanticResult);
            
            if (semanticResult.errors.length > 0) {
                throw new Error('Semantic analysis failed');
            }

            // Step 4: IR Generation
            console.log('Starting IR generation...');
            const optimizeCode = document.getElementById('optimizeCode').checked;
            const irResult = this.irGenerator.generate(parseResult.ast, optimizeCode);
            pipeline[3].completed = irResult.errors.length === 0;
            pipeline[3].error = irResult.errors.length > 0;
            
            this.compilationResults.ir = irResult.ir;
            this.compilationResults.errors = [...this.compilationResults.errors, ...irResult.errors];
            
            this.updateIRDisplay(irResult.ir);
            
            console.log('Compilation completed successfully!');

        } catch (error) {
            console.error('Compilation failed:', error);
            console.error('Error message:', error.message);
            console.error('Error stack:', error.stack);
            this.compilationResults.errors.push({
                type: 'CompilationError',
                message: error.message || 'Unknown compilation error occurred',
                line: error.line || null,
                column: error.column || null
            });
        } finally {
            this.showCompilationStatus(false);
            this.updateErrorsDisplay();
            this.updateSyntaxHighlighting();
        }
    }

    updateTokensDisplay(tokens) {
        const tokensOutput = document.getElementById('tokensOutput');
        if (!tokensOutput) return;

        const formattedTokens = MiniRustLexer.formatTokensForDisplay(tokens.filter(t => t.type !== 'EOF'));
        tokensOutput.textContent = JSON.stringify(formattedTokens, null, 2);
        
        // Update tab badge
        this.updateTabBadge('tokensTab', formattedTokens.length);
    }

    updateASTDisplay(ast) {
        const astOutput = document.getElementById('astOutput');
        if (!astOutput) return;

        if (ast) {
            astOutput.textContent = MiniRustParser.formatASTForDisplay(ast);
        } else {
            astOutput.textContent = 'AST generation failed';
        }
        
        // Update tab badge
        const nodeCount = ast ? this.countASTNodes(ast) : 0;
        this.updateTabBadge('astTab', nodeCount);
    }

    updateSemanticDisplay(semanticResult) {
        const symbolTableOutput = document.getElementById('symbolTableOutput');
        const ownershipOutput = document.getElementById('ownershipOutput');
        
        if (symbolTableOutput) {
            symbolTableOutput.textContent = JSON.stringify(semanticResult.symbolTable, null, 2);
        }
        
        if (ownershipOutput) {
            ownershipOutput.textContent = semanticResult.ownershipInfo.join('\n') || 'No ownership information available';
        }
        
        // Update tab badge
        const symbolCount = Object.keys(semanticResult.symbolTable || {}).length;
        this.updateTabBadge('semanticTab', symbolCount);
    }

    updateIRDisplay(ir) {
        const irOutput = document.getElementById('irOutput');
        if (!irOutput) return;

        irOutput.textContent = ir || 'No IR generated';
        
        // Count lines of IR
        const lineCount = ir ? ir.split('\n').filter(line => line.trim()).length : 0;
        this.updateTabBadge('irTab', lineCount);
    }

    updateErrorsDisplay() {
        const errorsOutput = document.getElementById('errorsOutput');
        if (!errorsOutput) return;

        // Enhance errors with suggestions
        const enhancedErrors = this.compilationResults.errors.map(error => 
            MiniRustErrorReporter.enhanceErrorWithSuggestions({...error})
        );

        MiniRustErrorReporter.displayErrors(
            enhancedErrors,
            this.compilationResults.warnings,
            errorsOutput,
            this.currentSourceCode
        );
        
        // Update tab badge
        const totalIssues = this.compilationResults.errors.length + this.compilationResults.warnings.length;
        this.updateTabBadge('errorsTab', totalIssues);
        
        // Auto-switch to errors tab if there are errors
        if (this.compilationResults.errors.length > 0) {
            this.switchOutputTab('errorsTab');
        }
    }

    updateTabBadge(tabSelector, count) {
        const badgeMap = {
            'tokensTab': 'tokensBadge',
            'astTab': 'astBadge', 
            'semanticTab': 'semanticBadge',
            'irTab': 'irBadge',
            'errorsTab': 'errorsBadge'
        };
        
        const badgeId = badgeMap[tabSelector];
        if (!badgeId) return;
        
        const badge = document.getElementById(badgeId);
        if (badge) {
            badge.textContent = count > 0 ? count : '';
        }
    }

    countASTNodes(node) {
        if (!node) return 0;
        let count = 1;
        for (const child of node.children || []) {
            count += this.countASTNodes(child);
        }
        return count;
    }

    showCompilationStatus(show) {
        const spinner = document.getElementById('compilationSpinner');
        const statusReady = document.getElementById('statusReady');
        const compileBtn = document.getElementById('compileBtn');
        const statusDot = document.querySelector('.status-dot');
        const statusIndicator = document.getElementById('statusIndicator');
        
        if (spinner && statusReady) {
            if (show) {
                spinner.classList.remove('d-none');
                statusReady.classList.add('d-none');
            } else {
                spinner.classList.add('d-none');
                statusReady.classList.remove('d-none');
            }
        }
        
        if (compileBtn) {
            compileBtn.disabled = show;
            compileBtn.innerHTML = show ? 
                '<i class="fas fa-spinner fa-spin"></i><span>Compiling...</span>' :
                '<i class="fas fa-play"></i><span>Compile & Run</span>';
        }
        
        if (statusDot) {
            statusDot.className = show ? 'status-dot compiling' : 'status-dot ready';
        }
        
        if (statusIndicator) {
            const statusText = statusIndicator.querySelector('span');
            if (statusText) {
                statusText.textContent = show ? 'Compiling' : 'Ready';
            }
        }
    }

    showError(message) {
        const errorsOutput = document.getElementById('errorsOutput');
        if (errorsOutput) {
            errorsOutput.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-circle"></i>
                    ${message}
                </div>
            `;
        }
        
        // Switch to errors tab
        const errorsTab = document.querySelector('[data-bs-target="#errorsTab"]');
        if (errorsTab) {
            errorsTab.click();
        }
    }

    updateSyntaxHighlighting() {
        // Trigger Prism.js to re-highlight code blocks
        if (typeof Prism !== 'undefined') {
            Prism.highlightAll();
        }
    }

    // Export functionality
    exportResults(format) {
        let content = '';
        let filename = '';
        let mimeType = 'text/plain';

        switch (format) {
            case 'llvm':
                content = this.compilationResults.ir || '';
                filename = 'output.ll';
                mimeType = 'text/plain';
                break;
            case 'json':
                content = JSON.stringify({
                    source: this.currentSourceCode,
                    tokens: this.compilationResults.tokens,
                    ast: this.compilationResults.ast,
                    semantic: this.compilationResults.semantic,
                    ir: this.compilationResults.ir,
                    errors: this.compilationResults.errors,
                    warnings: this.compilationResults.warnings
                }, null, 2);
                filename = 'compilation_results.json';
                mimeType = 'application/json';
                break;
            default:
                return;
        }

        if (!content) {
            this.showError('No content to export. Please compile some code first.');
            return;
        }

        // Create and trigger download
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    // Statistics and analytics
    getCompilationStats() {
        return {
            sourceLines: this.currentSourceCode.split('\n').length,
            tokensGenerated: this.compilationResults.tokens ? this.compilationResults.tokens.length - 1 : 0, // -1 for EOF
            astNodes: this.compilationResults.ast ? this.countASTNodes(this.compilationResults.ast) : 0,
            symbolsInTable: this.compilationResults.semantic ? Object.keys(this.compilationResults.semantic.symbolTable || {}).length : 0,
            irLines: this.compilationResults.ir ? this.compilationResults.ir.split('\n').filter(line => line.trim()).length : 0,
            errorCount: this.compilationResults.errors.length,
            warningCount: this.compilationResults.warnings.length,
            compilationSuccessful: this.compilationResults.errors.length === 0 && this.compilationResults.ir
        };
    }

    // New UI Methods
    switchOutputTab(targetId) {
        // Remove active from all tabs and panes
        document.querySelectorAll('.output-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelectorAll('.output-pane').forEach(pane => {
            pane.classList.remove('active');
        });
        
        // Add active to selected tab and pane
        const targetTab = document.querySelector(`[data-target="${targetId}"]`);
        const targetPane = document.getElementById(targetId);
        
        if (targetTab) targetTab.classList.add('active');
        if (targetPane) targetPane.classList.add('active');
    }
    
    // Enhanced Pipeline Visualization
    showPipelineStep(stepName, status) {
        const stepElement = document.getElementById(stepName);
        const connector = stepElement?.parentElement.querySelector('.step-connector');
        
        if (stepElement) {
            stepElement.className = `step-icon ${status}`;
            
            if (connector && status === 'completed') {
                connector.classList.add('completed');
            } else if (connector && status === 'active') {
                connector.classList.add('active');
            }
        }
    }
    
    resetPipeline() {
        const steps = ['lexStep', 'parseStep', 'semanticStep', 'irStep'];
        steps.forEach(stepId => {
            const step = document.getElementById(stepId);
            const connector = step?.parentElement.querySelector('.step-connector');
            
            if (step) {
                step.className = 'step-icon pending';
            }
            if (connector) {
                connector.className = 'step-connector';
            }
        });
    }
    
    updateCompilationStats(stats) {
        const compileTimeEl = document.getElementById('compileTime');
        const memoryUsageEl = document.getElementById('memoryUsage');
        const tokenCountEl = document.getElementById('tokenCount');
        
        if (compileTimeEl) compileTimeEl.textContent = `${stats.compileTime || 0}ms`;
        if (memoryUsageEl) memoryUsageEl.textContent = `${stats.memoryUsage || 0}KB`;
        if (tokenCountEl) tokenCountEl.textContent = stats.tokenCount || 0;
    }
    
    updateProgressBar(percentage) {
        const progressBar = document.getElementById('progressBar');
        if (progressBar) {
            progressBar.style.width = `${percentage}%`;
        }
    }
    
    updateLineNumbers() {
        const sourceCode = document.getElementById('sourceCode');
        const lineNumbers = document.getElementById('lineNumbers');
        
        if (!sourceCode || !lineNumbers) return;
        
        const lines = sourceCode.value.split('\n');
        const lineNumbersText = lines.map((_, index) => index + 1).join('\n');
        lineNumbers.textContent = lineNumbersText;
    }
    
    updateStatusBar() {
        const sourceCode = document.getElementById('sourceCode');
        const lineColumn = document.getElementById('lineColumn');
        const compileTime = document.getElementById('compileTime');
        
        if (!sourceCode) return;
        
        // Get cursor position
        const cursorPosition = sourceCode.selectionStart;
        const textBeforeCursor = sourceCode.value.substring(0, cursorPosition);
        const lines = textBeforeCursor.split('\n');
        const currentLine = lines.length;
        const currentColumn = lines[lines.length - 1].length + 1;
        
        if (lineColumn) {
            lineColumn.textContent = `Ln ${currentLine}, Col ${currentColumn}`;
        }
        
        if (compileTime) {
            const hasErrors = this.compilationResults.errors.length > 0;
            const hasWarnings = this.compilationResults.warnings.length > 0;
            
            if (hasErrors) {
                compileTime.textContent = 'Error';
                compileTime.style.color = 'var(--error)';
            } else if (hasWarnings) {
                compileTime.textContent = 'Warning';
                compileTime.style.color = 'var(--warning)';
            } else if (this.compilationResults.ir) {
                compileTime.textContent = 'Success';
                compileTime.style.color = 'var(--success)';
            } else {
                compileTime.textContent = 'Ready';
                compileTime.style.color = 'var(--text-muted)';
            }
        }
    }

    // Debug functionality
    debugMode(enabled) {
        if (enabled) {
            console.log('Debug mode enabled');
            window.debugCompiler = {
                app: this,
                lexer: this.lexer,
                parser: this.parser,
                semanticAnalyzer: this.semanticAnalyzer,
                irGenerator: this.irGenerator,
                results: this.compilationResults
            };
            console.log('Debug object available at window.debugCompiler');
        } else {
            delete window.debugCompiler;
            console.log('Debug mode disabled');
        }
    }
}

// Global application instance
let app;

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing MiniRust Compiler...');
    app = new MiniRustCompilerApp();
    
    // Make app globally accessible for onclick handlers
    window.app = app;
    
    console.log('MiniRust Compiler initialized successfully!');
    console.log('Use Ctrl+Enter to compile, Ctrl+L to load examples');
    
    // Enable debug mode in development
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        app.debugMode(true);
    }
});

// Handle page visibility changes to pause/resume any background tasks
document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
        console.log('Page hidden - pausing compiler');
    } else {
        console.log('Page visible - resuming compiler');
    }
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MiniRustCompilerApp };
}

![img alt](https://github.com/birukG09/MiniRust-Compiler/blob/8778aa850554cbccc5bb7e84a35dce47fdcf1a4a/Screenshot%202025-08-22%20234710.png)
# MiniRust Compiler

**Tagline:** Compile. Visualize. Understand Rust Internals.

---

## Table of Contents

1. [Project Overview](#project-overview)  
2. [Features](#features)  
3. [Installation](#installation)  
4. [Usage](#usage)  
5. [Visualization & Theme](#visualization--theme)  
6. [Examples](#examples)  
7. [Contributing](#contributing)  


---

## Project Overview

MiniRust Compiler is an **interactive Rust subset compiler** designed for developers, students, and systems programming enthusiasts. It allows users to write simplified Rust code including variables, functions, loops, and conditionals, and then compiles it into LLVM IR.

Key highlights:

- **Ownership & Borrow Checker:** Learn Rust memory safety with live ownership error detection.
- **LLVM Backend:** Translates MiniRust code into LLVM IR, assembly, and optionally WebAssembly.
- **Interactive Frontend:** AST and IR visualizations, REPL playground, and live error diagnostics.
- **Modern Theme:** MoonSpace-GreenNature aesthetic with cosmic backgrounds and green highlights.

MiniRust Compiler serves as both a **learning platform** and a **developer showcase**, demonstrating modern systems programming and compiler design.

---

## Features

### Frontend Features
- Lexer & Parser for Rust subset syntax.
- Syntax highlighting with MoonSpace-GreenNature theme.
- Interactive AST tree view and LLVM IR flow graph.
- Ownership and borrow checker visualization.
- REPL playground for live code execution.
- Step-through execution mode for debugging and learning.
- Optional CLI ASCII mode for lightweight terminal usage.

### Backend Features
- LLVM IR generation via Inkwell (Rust bindings for LLVM).
- Code optimizations: constant folding, dead code elimination.
- Optional WebAssembly backend for running MiniRust in the browser.
- JIT execution support for immediate code running.

### Extra Features
- Core:
  - Simplified ownership and borrow checker.
  - Rust-like custom error messages with hints.
  - Visualization of AST, IR, and ownership flows.
- Bonus:
  - WebAssembly backend.
  - REPL playground.
  - LSP server for VSCode integration.

---

## Installation

### Prerequisites
- Rust (https://www.rust-lang.org/tools/install)
- LLVM (Ensure LLVM binaries are in your PATH)
- Node.js (optional, for web visualization)

### Steps
1. Clone the repository:

```bash
git clone https://github.com/birukG09/MiniRust-Compiler.git
cd MiniRust-Compiler
Build the project:

bash
Copy
Edit
cargo build --release
(Optional) Install visualization dependencies if using the web frontend:

bash
Copy
Edit
cd frontend
npm install
npm start
Usage
Compile a file:
bash
Copy
Edit
cargo run --release -- file example.rs
REPL Playground:
bash
Copy
Edit
cargo run --release --repl
CLI Flags:
--emit-llvm → Generate LLVM IR file.

--emit-asm → Generate assembly file.

--check-ownership → Run ownership/borrow checker.

--O0, --O1, --O2 → Set optimization level.

Visualization & Theme
Theme: MoonSpace-GreenNature

Background: Deep cosmic navy (#0B0C2A)

Primary: Green gradient (#3EB489)

Secondary: Soft highlights (#A1F0C1)

Text: Clear readable white (#E0F7FA)

Highlight: Accent yellow (#FFD166)

Features:

AST and IR trees with animated node expansion.

Ownership flows highlighted with gradient green lines.

Interactive REPL with live syntax feedback.

Examples
Ownership Error Example
rust
Copy
Edit
let mut x = 5;
let y = &x;
let z = &mut x; // Ownership error detected
Output:

vbnet
Copy
Edit
Error: Cannot borrow `x` as mutable because it is already borrowed as immutable.
Hint: Consider removing the immutable borrow or creating a new variable.
AST Visualization
Nodes expand/collapse interactively.

Leaf nodes show variable types and scope.

Ownership flow highlighted with green arrows.

REPL Playground
bash
Copy
Edit
> let a = 10;
> let b = &a;
> print(b);
Outputs live IR, syntax highlighting, and ownership flow.

Contributing
We welcome contributions from the community!

Fork the repository.

Create a feature branch (git checkout -b feature-name).

Commit your changes (git commit -m "Add feature").

Push to your branch (git push origin feature-name).

Open a Pull Request.

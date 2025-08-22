/**
 * Sample MiniRust Programs
 * Collection of example programs to demonstrate compiler features
 */

const SAMPLE_PROGRAMS = {
    basic_variables: {
        title: "Basic Variables and Types",
        description: "Demonstrates variable declaration, mutability, and basic types",
        code: `fn main() {
    let x: i32 = 42;
    let mut y: f64 = 3.14;
    let flag: bool = true;
    let message: str = "Hello, MiniRust!";
    
    print(x);
    print(y);
    print(flag);
    print(message);
}`
    },

    mutable_variables: {
        title: "Mutable Variables",
        description: "Shows how to modify mutable variables",
        code: `fn main() {
    let mut counter: i32 = 0;
    let mut temperature: f64 = 20.5;
    
    print(counter);
    counter = counter + 1;
    print(counter);
    
    temperature = temperature + 2.5;
    print(temperature);
}`
    },

    conditionals: {
        title: "If-Else Statements",
        description: "Demonstrates conditional logic",
        code: `fn main() {
    let age: i32 = 18;
    let is_adult: bool = false;
    
    if age >= 18 {
        is_adult = true;
        print(1); // true
    } else {
        is_adult = false;
        print(0); // false
    }
    
    let x: i32 = 10;
    let y: i32 = 20;
    
    if x < y {
        print(x);
    } else {
        print(y);
    }
}`
    },

    loops: {
        title: "While Loops",
        description: "Shows loop constructs and iteration",
        code: `fn main() {
    let mut i: i32 = 0;
    
    while i < 5 {
        print(i);
        i = i + 1;
    }
    
    let mut countdown: i32 = 3;
    while countdown > 0 {
        print(countdown);
        countdown = countdown - 1;
    }
    
    print(0); // blast off!
}`
    },

    functions: {
        title: "Function Definitions",
        description: "Demonstrates function definition and parameters",
        code: `fn add(a: i32, b: i32) -> i32 {
    return a + b;
}

fn greet(name: str) {
    print("Hello");
    print(name);
}

fn main() {
    let result: i32 = add(5, 3);
    print(result);
    
    greet("Alice");
    greet("Bob");
}`
    },

    arithmetic: {
        title: "Arithmetic Operations",
        description: "Shows various arithmetic and comparison operations",
        code: `fn main() {
    let a: i32 = 15;
    let b: i32 = 4;
    
    let sum: i32 = a + b;
    let diff: i32 = a - b;
    let product: i32 = a * b;
    let quotient: i32 = a / b;
    let remainder: i32 = a % b;
    
    print(sum);     // 19
    print(diff);    // 11
    print(product); // 60
    print(quotient); // 3
    print(remainder); // 3
    
    let pi: f64 = 3.14159;
    let radius: f64 = 5.0;
    let area: f64 = pi * radius * radius;
    
    print(area);
}`
    },

    ownership_basic: {
        title: "Basic Ownership",
        description: "Demonstrates basic ownership and borrowing rules",
        code: `fn main() {
    let x: i32 = 10;
    let y: i32 = x; // Value copied (i32 is Copy)
    
    print(x);
    print(y);
    
    let mut z: i32 = 20;
    let w: i32 = z;
    z = 30; // OK, z is mutable
    
    print(z);
    print(w);
}`
    },

    ownership_borrow: {
        title: "Borrowing Examples",
        description: "Shows immutable and mutable borrowing",
        code: `fn print_value(val: i32) {
    print(val);
}

fn increment(val: i32) -> i32 {
    return val + 1;
}

fn main() {
    let mut x: i32 = 42;
    
    // Immutable borrow
    let borrowed_x: i32 = x;
    print(borrowed_x);
    
    // Can still use x after immutable borrow
    print(x);
    
    // Mutable operation
    x = increment(x);
    print(x);
}`
    },

    complex_example: {
        title: "Complex Example",
        description: "A more complex program combining multiple features",
        code: `fn factorial(n: i32) -> i32 {
    let mut result: i32 = 1;
    let mut i: i32 = 1;
    
    while i <= n {
        result = result * i;
        i = i + 1;
    }
    
    return result;
}

fn is_even(n: i32) -> bool {
    let remainder: i32 = n % 2;
    return remainder == 0;
}

fn main() {
    let mut num: i32 = 5;
    
    print(num);
    
    let fact: i32 = factorial(num);
    print(fact); // 120
    
    let mut i: i32 = 1;
    while i <= 10 {
        if is_even(i) {
            print(i);
        }
        i = i + 1;
    }
    
    // Test different types
    let temperature: f64 = 23.5;
    let is_warm: bool = temperature > 20.0;
    
    if is_warm {
        print(1); // true
    } else {
        print(0); // false
    }
}`
    },

    error_examples: {
        title: "Common Errors",
        description: "Examples that should produce compilation errors",
        code: `fn main() {
    // Error: immutable variable assignment
    let x: i32 = 10;
    x = 20; // ERROR: cannot assign to immutable variable
    
    // Error: type mismatch
    let mut y: i32 = 42;
    y = 3.14; // ERROR: type mismatch
    
    // Error: undefined variable
    print(undefined_var); // ERROR: undefined variable
    
    // Error: wrong condition type
    if 42 { // ERROR: condition must be bool
        print(1);
    }
}`
    },

    ownership_errors: {
        title: "Ownership Errors",
        description: "Examples of ownership rule violations",
        code: `fn main() {
    let mut x: i32 = 42;
    
    // This would be OK in real Rust with proper borrowing
    let ref1: i32 = x;  // immutable borrow
    let ref2: i32 = x;  // another immutable borrow (OK)
    
    print(ref1);
    print(ref2);
    
    // Error: cannot borrow as mutable while immutable borrows exist
    // let mut_ref = &mut x; // ERROR in more advanced ownership checking
    
    x = x + 1; // This might cause issues depending on borrow scope
    print(x);
}`
    }
};

// Helper function to get program by key
function getSampleProgram(key) {
    return SAMPLE_PROGRAMS[key] || null;
}

// Helper function to get all program titles
function getSampleProgramTitles() {
    return Object.keys(SAMPLE_PROGRAMS).map(key => ({
        key: key,
        title: SAMPLE_PROGRAMS[key].title,
        description: SAMPLE_PROGRAMS[key].description
    }));
}

// Helper function to get random sample program
function getRandomSampleProgram() {
    const keys = Object.keys(SAMPLE_PROGRAMS);
    const randomKey = keys[Math.floor(Math.random() * keys.length)];
    return {
        key: randomKey,
        ...SAMPLE_PROGRAMS[randomKey]
    };
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { 
        SAMPLE_PROGRAMS, 
        getSampleProgram, 
        getSampleProgramTitles, 
        getRandomSampleProgram 
    };
}

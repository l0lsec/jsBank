// ====================================
// Browser Variable Inspector Utility
// ====================================

(function() {
    'use strict';
    
    /**
     * Get all global variables (filters out native browser properties)
     */
    function getGlobalVariables() {
        const globals = {};
        const nativeProps = new Set(Object.getOwnPropertyNames(window));
        
        // Store initial native properties by creating a fresh iframe
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        document.body.appendChild(iframe);
        const freshWindow = iframe.contentWindow;
        
        const freshProps = new Set(Object.getOwnPropertyNames(freshWindow));
        document.body.removeChild(iframe);
        
        // Find user-defined global variables
        for (let prop of nativeProps) {
            if (!freshProps.has(prop)) {
                try {
                    globals[prop] = window[prop];
                } catch (e) {
                    globals[prop] = `[Error accessing: ${e.message}]`;
                }
            }
        }
        
        return globals;
    }
    
    /**
     * Get all properties of an object (including inherited)
     */
    function getAllProperties(obj) {
        const props = {};
        let current = obj;
        
        while (current && current !== Object.prototype) {
            for (let prop of Object.getOwnPropertyNames(current)) {
                if (!(prop in props)) {
                    try {
                        props[prop] = obj[prop];
                    } catch (e) {
                        props[prop] = `[Error accessing: ${e.message}]`;
                    }
                }
            }
            current = Object.getPrototypeOf(current);
        }
        
        return props;
    }
    
    /**
     * Format and print variables with type information
     */
    function printVariables(vars, title = 'Variables') {
        console.group(`🔍 ${title}`);
        
        if (Object.keys(vars).length === 0) {
            console.log('No variables found');
            console.groupEnd();
            return;
        }
        
        for (let [key, value] of Object.entries(vars)) {
            const type = typeof value;
            const isArray = Array.isArray(value);
            const isNull = value === null;
            const isUndefined = value === undefined;
            
            let displayType = type;
            if (isNull) displayType = 'null';
            if (isArray) displayType = 'array';
            if (value && typeof value === 'object' && value.constructor) {
                displayType = value.constructor.name;
            }
            
            console.groupCollapsed(`📌 ${key}: [${displayType}]`);
            
            // Show value
            if (type === 'function') {
                console.log('Function:', value.toString().substring(0, 100) + '...');
            } else if (isArray) {
                console.log('Length:', value.length);
                console.log('Value:', value);
            } else if (type === 'object' && !isNull) {
                console.log('Value:', value);
                console.log('Keys:', Object.keys(value));
            } else {
                console.log('Value:', value);
            }
            
            console.groupEnd();
        }
        
        console.groupEnd();
    }
    
    /**
     * Inspect local variables in current scope (use in debugger)
     */
    function inspectLocalScope() {
        console.warn('⚠️  To inspect local variables, you need to:');
        console.warn('1. Set a breakpoint or add "debugger;" statement');
        console.warn('2. When paused, type: Object.keys(this) or use Scope panel');
        console.warn('3. Or use: for(let key in this) { console.log(key, this[key]); }');
    }
    
    /**
     * Main inspection function
     */
    window.inspectVariables = function(options = {}) {
        const {
            showGlobals = true,
            showWindow = false,
            showDocument = false,
            filterPattern = null,
            obj = null
        } = options;
        
        console.clear();
        console.log('🚀 Variable Inspector - Starting inspection...\n');
        
        // Inspect custom object
        if (obj !== null) {
            const props = getAllProperties(obj);
            printVariables(props, `Properties of ${obj.constructor?.name || 'Object'}`);
            return;
        }
        
        // Show user-defined globals
        if (showGlobals) {
            let globals = getGlobalVariables();
            
            if (filterPattern) {
                const regex = new RegExp(filterPattern, 'i');
                globals = Object.fromEntries(
                    Object.entries(globals).filter(([key]) => regex.test(key))
                );
            }
            
            printVariables(globals, 'User-Defined Global Variables');
        }
        
        // Show window object properties
        if (showWindow) {
            const windowProps = Object.getOwnPropertyNames(window)
                .reduce((acc, key) => {
                    try {
                        acc[key] = window[key];
                    } catch (e) {
                        acc[key] = '[Error accessing]';
                    }
                    return acc;
                }, {});
            printVariables(windowProps, 'Window Object Properties');
        }
        
        // Show document properties
        if (showDocument) {
            const docProps = getAllProperties(document);
            printVariables(docProps, 'Document Properties');
        }
        
        console.log('\n✅ Inspection complete!');
        console.log('\n📖 Usage examples:');
        console.log('  inspectVariables() - Show user-defined globals');
        console.log('  inspectVariables({ showWindow: true }) - Include window properties');
        console.log('  inspectVariables({ filterPattern: "user" }) - Filter by pattern');
        console.log('  inspectVariables({ obj: myObject }) - Inspect specific object');
        console.log('  listAllGlobals() - Quick view of all global variable names');
    };
    
    /**
     * Quick function to list just the names
     */
    window.listAllGlobals = function() {
        const globals = getGlobalVariables();
        console.log('📝 User-Defined Global Variables:', Object.keys(globals));
        return Object.keys(globals);
    };
    
    /**
     * Helper to inspect localStorage and sessionStorage
     */
    window.inspectStorage = function() {
        console.group('💾 Browser Storage');
        
        console.group('📦 localStorage');
        if (localStorage.length === 0) {
            console.log('Empty');
        } else {
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                console.log(`${key}:`, localStorage.getItem(key));
            }
        }
        console.groupEnd();
        
        console.group('📦 sessionStorage');
        if (sessionStorage.length === 0) {
            console.log('Empty');
        } else {
            for (let i = 0; i < sessionStorage.length; i++) {
                const key = sessionStorage.key(i);
                console.log(`${key}:`, sessionStorage.getItem(key));
            }
        }
        console.groupEnd();
        
        console.groupEnd();
    };
    
    // Auto-run basic inspection
    console.log('✨ Variable Inspector loaded! Use these commands:');
    console.log('  • inspectVariables() - Inspect all variables');
    console.log('  • listAllGlobals() - Quick list of global variables');
    console.log('  • inspectStorage() - View localStorage/sessionStorage');
    console.log('  • inspectVariables({ obj: yourObject }) - Inspect any object\n');
    
})();

// Auto-run to show what's available
inspectVariables();
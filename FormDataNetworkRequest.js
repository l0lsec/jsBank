// ====================================
// Form Data & Network Request Logger
// ====================================

(function() {
    'use strict';
    
    let requestLog = [];
    let formLog = [];
    
    /**
     * Intercept fetch requests
     */
    const originalFetch = window.fetch;
    window.fetch = function(...args) {
        const [resource, config] = args;
        
        const logEntry = {
            timestamp: new Date().toISOString(),
            method: config?.method || 'GET',
            url: resource,
            headers: config?.headers || {},
            body: config?.body || null,
        };
        
        requestLog.push(logEntry);
        
        console.log('📤 Fetch Request:', logEntry.method, logEntry.url);
        if (logEntry.body) {
            console.log('Body:', logEntry.body);
        }
        
        return originalFetch.apply(this, args)
            .then(response => {
                console.log('📥 Fetch Response:', response.status, logEntry.url);
                return response;
            });
    };
    
    /**
     * Intercept XMLHttpRequest
     */
    const originalXHROpen = XMLHttpRequest.prototype.open;
    const originalXHRSend = XMLHttpRequest.prototype.send;
    
    XMLHttpRequest.prototype.open = function(method, url, ...rest) {
        this._requestInfo = { method, url };
        return originalXHROpen.apply(this, [method, url, ...rest]);
    };
    
    XMLHttpRequest.prototype.send = function(body) {
        if (this._requestInfo) {
            const logEntry = {
                timestamp: new Date().toISOString(),
                method: this._requestInfo.method,
                url: this._requestInfo.url,
                body: body,
            };
            
            requestLog.push(logEntry);
            console.log('📤 XHR Request:', logEntry.method, logEntry.url);
            if (body) console.log('Body:', body);
        }
        
        return originalXHRSend.apply(this, [body]);
    };
    
    /**
     * Monitor form submissions
     */
    document.addEventListener('submit', function(e) {
        const form = e.target;
        const formData = new FormData(form);
        const data = {};
        
        formData.forEach((value, key) => {
            data[key] = value;
        });
        
        const logEntry = {
            timestamp: new Date().toISOString(),
            action: form.action,
            method: form.method,
            data: data,
        };
        
        formLog.push(logEntry);
        
        console.group('📝 Form Submission');
        console.log('Action:', logEntry.action);
        console.log('Method:', logEntry.method);
        console.log('Data:', logEntry.data);
        console.groupEnd();
    }, true);
    
    /**
     * View logged requests
     */
    window.showRequestLog = function() {
        console.group('📊 Request Log');
        console.table(requestLog);
        console.groupEnd();
        return requestLog;
    };
    
    /**
     * View logged form submissions
     */
    window.showFormLog = function() {
        console.group('📊 Form Submission Log');
        console.table(formLog);
        console.groupEnd();
        return formLog;
    };
    
    /**
     * Clear logs
     */
    window.clearLogs = function() {
        requestLog = [];
        formLog = [];
        console.log('✅ Logs cleared');
    };
    
    /**
     * Find all forms and their fields
     */
    window.findAllForms = function() {
        const forms = document.querySelectorAll('form');
        
        console.group('📝 Form Discovery');
        console.log(`Found ${forms.length} form(s)\n`);
        
        forms.forEach((form, index) => {
            console.groupCollapsed(`Form ${index + 1}: ${form.action || '(no action)'}`);
            console.log('Method:', form.method || 'GET');
            console.log('Action:', form.action || window.location.href);
            console.log('ID:', form.id || '(none)');
            console.log('Name:', form.name || '(none)');
            
            const inputs = form.querySelectorAll('input, textarea, select');
            console.log(`\nFields (${inputs.length}):`);
            
            inputs.forEach(input => {
                console.log(`  - ${input.name || input.id || '(unnamed)'} [${input.type || input.tagName}]`);
            });
            
            console.groupEnd();
        });
        
        console.groupEnd();
        return forms;
    };
    
    console.log('✅ Request & Form Logger loaded!');
    console.log('Commands: showRequestLog(), showFormLog(), findAllForms(), clearLogs()');
})();
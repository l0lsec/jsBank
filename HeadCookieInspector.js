// ====================================
// Security Headers & Cookie Inspector
// ====================================

(function() {
    'use strict';
    
    /**
     * Check security headers
     */
    window.checkSecurityHeaders = async function() {
        console.group('🛡️  Security Headers Check');
        
        try {
            const response = await fetch(window.location.href, { method: 'HEAD' });
            const headers = {};
            
            response.headers.forEach((value, key) => {
                headers[key] = value;
            });
            
            // Check critical security headers
            const securityHeaders = {
                'content-security-policy': 'Content Security Policy',
                'x-frame-options': 'X-Frame-Options',
                'x-content-type-options': 'X-Content-Type-Options',
                'strict-transport-security': 'HTTP Strict Transport Security (HSTS)',
                'x-xss-protection': 'X-XSS-Protection',
                'referrer-policy': 'Referrer Policy',
                'permissions-policy': 'Permissions Policy',
            };
            
            console.log('📋 Security Header Status:\n');
            
            for (let [header, name] of Object.entries(securityHeaders)) {
                if (headers[header]) {
                    console.log(`✅ ${name}:`, headers[header]);
                } else {
                    console.warn(`❌ ${name}: MISSING`);
                }
            }
            
            console.log('\n📋 All Response Headers:');
            console.table(headers);
            
        } catch (e) {
            console.error('Error fetching headers:', e);
        }
        
        console.groupEnd();
    };
    
    /**
     * Inspect and analyze cookies
     */
    window.inspectCookies = function() {
        console.group('🍪 Cookie Security Analysis');
        
        const cookies = document.cookie.split(';').map(c => c.trim()).filter(c => c);
        
        if (cookies.length === 0) {
            console.log('No cookies found');
            console.groupEnd();
            return;
        }
        
        console.log(`Found ${cookies.length} cookie(s)\n`);
        
        cookies.forEach(cookie => {
            const [name, ...valueParts] = cookie.split('=');
            const value = valueParts.join('=');
            
            console.groupCollapsed(`🍪 ${name.trim()}`);
            console.log('Value:', value);
            console.log('Length:', value.length);
            
            // Security analysis
            console.log('\n🔒 Security Flags (from document.cookie - limited info):');
            console.warn('⚠️  HttpOnly: Cannot be checked via JavaScript (good if set)');
            console.warn('⚠️  Secure: Cannot be checked directly');
            console.warn('⚠️  SameSite: Cannot be checked directly');
            console.log('\nℹ️  Use DevTools > Application > Cookies for full details');
            
            // Try to detect session tokens
            if (name.toLowerCase().includes('session') || 
                name.toLowerCase().includes('token') ||
                name.toLowerCase().includes('auth')) {
                console.warn('🔑 Potential authentication cookie detected!');
            }
            
            console.groupEnd();
        });
        
        console.groupEnd();
    };
    
    /**
     * Test for cookie manipulation
     */
    window.testCookieManipulation = function(cookieName, newValue) {
        try {
            document.cookie = `${cookieName}=${newValue}; path=/`;
            console.log(`✅ Successfully set cookie: ${cookieName}=${newValue}`);
            console.log('Current cookies:', document.cookie);
        } catch (e) {
            console.error('❌ Failed to set cookie:', e);
        }
    };
    
    console.log('✅ Security Headers & Cookie Inspector loaded!');
    console.log('Commands: checkSecurityHeaders(), inspectCookies(), testCookieManipulation(name, value)');
})();
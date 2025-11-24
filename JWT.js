// ====================================
// Authentication & JWT Token Inspector
// ====================================

(function() {
    'use strict';
    
    /**
     * Decode JWT token
     */
    function decodeJWT(token) {
        try {
            const parts = token.split('.');
            if (parts.length !== 3) {
                throw new Error('Invalid JWT format');
            }
            
            const header = JSON.parse(atob(parts[0]));
            const payload = JSON.parse(atob(parts[1]));
            const signature = parts[2];
            
            return { header, payload, signature };
        } catch (e) {
            console.error('Failed to decode JWT:', e);
            return null;
        }
    }
    
    /**
     * Find and decode JWT tokens
     */
    window.findJWTTokens = function() {
        console.group('🔑 JWT Token Discovery');
        
        const tokens = [];
        
        // Check localStorage
        console.log('\n📦 Checking localStorage...');
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            const value = localStorage.getItem(key);
            
            if (value && value.match(/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/)) {
                console.log(`Found potential JWT in localStorage["${key}"]`);
                tokens.push({ source: 'localStorage', key, token: value });
            }
        }
        
        // Check sessionStorage
        console.log('\n📦 Checking sessionStorage...');
        for (let i = 0; i < sessionStorage.length; i++) {
            const key = sessionStorage.key(i);
            const value = sessionStorage.getItem(key);
            
            if (value && value.match(/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/)) {
                console.log(`Found potential JWT in sessionStorage["${key}"]`);
                tokens.push({ source: 'sessionStorage', key, token: value });
            }
        }
        
        // Check cookies
        console.log('\n🍪 Checking cookies...');
        const cookies = document.cookie.split(';');
        cookies.forEach(cookie => {
            const [name, value] = cookie.split('=').map(s => s.trim());
            if (value && value.match(/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/)) {
                console.log(`Found potential JWT in cookie["${name}"]`);
                tokens.push({ source: 'cookie', key: name, token: value });
            }
        });
        
        // Decode and display tokens
        if (tokens.length > 0) {
            console.log(`\n\n📊 Decoded Tokens (${tokens.length}):\n`);
            
            tokens.forEach((item, index) => {
                console.groupCollapsed(`Token ${index + 1} from ${item.source}["${item.key}"]`);
                
                const decoded = decodeJWT(item.token);
                if (decoded) {
                    console.log('Header:', decoded.header);
                    console.log('Payload:', decoded.payload);
                    console.log('Signature:', decoded.signature);
                    
                    // Check expiration
                    if (decoded.payload.exp) {
                        const expDate = new Date(decoded.payload.exp * 1000);
                        const now = new Date();
                        console.log('\n⏰ Expiration:', expDate.toLocaleString());
                        
                        if (expDate < now) {
                            console.warn('❌ Token is EXPIRED');
                        } else {
                            console.log('✅ Token is still valid');
                        }
                    }
                }
                
                console.groupEnd();
            });
        } else {
            console.log('No JWT tokens found');
        }
        
        console.groupEnd();
        return tokens;
    };
    
    /**
     * Decode a specific JWT token
     */
    window.decodeJWT = function(token) {
        const decoded = decodeJWT(token);
        if (decoded) {
            console.log('Header:', decoded.header);
            console.log('Payload:', decoded.payload);
            console.log('Signature:', decoded.signature);
        }
        return decoded;
    };
    
    /**
     * Find all authorization headers
     */
    window.findAuthHeaders = function() {
        console.group('🔐 Authorization Header Discovery');
        console.log('Intercepting requests to detect authorization headers...');
        console.log('Make some requests on the page and check the Request Log');
        console.groupEnd();
    };
    
    console.log('✅ JWT Token Inspector loaded!');
    console.log('Commands: findJWTTokens(), decodeJWT(token), findAuthHeaders()');
})();
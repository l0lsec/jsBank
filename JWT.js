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
     * Check if a string is a valid JWT format
     */
    function isJWT(value) {
        return typeof value === 'string' && 
               value.match(/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/);
    }
    
    /**
     * Recursively search for JWT tokens in an object
     */
    function findJWTsInObject(obj, path = '', tokens = [], source = '', storageKey = '') {
        // Common token property names to search for
        const tokenKeys = [
            'accessToken', 'access_token',
            'idToken', 'id_token', 
            'refreshToken', 'refresh_token',
            'token', 'jwt', 'secret',
            'bearerToken', 'bearer_token',
            'authToken', 'auth_token'
        ];
        
        if (typeof obj === 'string') {
            // Check if the string itself is a JWT
            if (isJWT(obj)) {
                tokens.push({
                    source: source,
                    key: storageKey,
                    path: path,
                    token: obj
                });
            }
        } else if (typeof obj === 'object' && obj !== null) {
            // Search through object properties
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    const value = obj[key];
                    const currentPath = path ? `${path}.${key}` : key;
                    
                    // Check if this is a known token property
                    if (tokenKeys.includes(key) && isJWT(value)) {
                        tokens.push({
                            source: source,
                            key: storageKey,
                            path: currentPath,
                            token: value
                        });
                    } else {
                        // Recursively search nested objects and arrays
                        findJWTsInObject(value, currentPath, tokens, source, storageKey);
                    }
                }
            }
        }
        
        return tokens;
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
            
            if (!value) continue;
            
            // First check if the value itself is a JWT
            if (isJWT(value)) {
                console.log(`Found JWT in localStorage["${key}"]`);
                tokens.push({ source: 'localStorage', key, path: '', token: value });
            } else {
                // Try to parse as JSON and search for JWTs inside
                try {
                    const parsed = JSON.parse(value);
                    const foundTokens = findJWTsInObject(parsed, '', [], 'localStorage', key);
                    foundTokens.forEach(token => {
                        console.log(`Found JWT in localStorage["${key}"]${token.path ? '.' + token.path : ''}`);
                        tokens.push(token);
                    });
                } catch (e) {
                    // Not JSON, skip
                }
            }
        }
        
        // Check sessionStorage
        console.log('\n📦 Checking sessionStorage...');
        for (let i = 0; i < sessionStorage.length; i++) {
            const key = sessionStorage.key(i);
            const value = sessionStorage.getItem(key);
            
            if (!value) continue;
            
            // First check if the value itself is a JWT
            if (isJWT(value)) {
                console.log(`Found JWT in sessionStorage["${key}"]`);
                tokens.push({ source: 'sessionStorage', key, path: '', token: value });
            } else {
                // Try to parse as JSON and search for JWTs inside
                try {
                    const parsed = JSON.parse(value);
                    const foundTokens = findJWTsInObject(parsed, '', [], 'sessionStorage', key);
                    foundTokens.forEach(token => {
                        console.log(`Found JWT in sessionStorage["${key}"]${token.path ? '.' + token.path : ''}`);
                        tokens.push(token);
                    });
                } catch (e) {
                    // Not JSON, skip
                }
            }
        }
        
        // Check cookies
        console.log('\n🍪 Checking cookies...');
        const cookies = document.cookie.split(';');
        cookies.forEach(cookie => {
            const [name, value] = cookie.split('=').map(s => s.trim());
            
            if (!value) return;
            
            // First check if the value itself is a JWT
            if (isJWT(value)) {
                console.log(`Found JWT in cookie["${name}"]`);
                tokens.push({ source: 'cookie', key: name, path: '', token: value });
            } else {
                // Try to parse as JSON and search for JWTs inside
                try {
                    const decoded = decodeURIComponent(value);
                    const parsed = JSON.parse(decoded);
                    const foundTokens = findJWTsInObject(parsed, '', [], 'cookie', name);
                    foundTokens.forEach(token => {
                        console.log(`Found JWT in cookie["${name}"]${token.path ? '.' + token.path : ''}`);
                        tokens.push(token);
                    });
                } catch (e) {
                    // Not JSON, skip
                }
            }
        });
        
        // Decode and display tokens
        if (tokens.length > 0) {
            console.log(`\n\n📊 Decoded Tokens (${tokens.length}):\n`);
            
            tokens.forEach((item, index) => {
                const location = item.path 
                    ? `${item.source}["${item.key}"].${item.path}`
                    : `${item.source}["${item.key}"]`;
                    
                console.groupCollapsed(`Token ${index + 1} from ${location}`);
                
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
     * Find MSAL (Microsoft Authentication Library) tokens and keys
     */
    window.findMSALTokens = function() {
        console.group('🔐 MSAL Token Discovery');
        
        const msalData = {
            accounts: [],
            accessTokens: [],
            idTokens: [],
            refreshTokens: [],
            otherKeys: []
        };
        
        const allTokens = [];
        
        // Check localStorage for MSAL keys
        console.log('\n📦 Checking localStorage for MSAL data...');
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            
            // MSAL keys typically start with client ID or contain 'msal', 'login.windows.net', etc.
            if (key.toLowerCase().includes('msal') || 
                key.includes('login.windows.net') || 
                key.includes('login.microsoftonline.com') ||
                key.match(/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/i)) {
                
                const value = localStorage.getItem(key);
                console.log(`Found MSAL key: ${key}`);
                
                try {
                    const parsed = JSON.parse(value);
                    
                    // Check for account information
                    if (key.toLowerCase().includes('account') || parsed.homeAccountId) {
                        msalData.accounts.push({ key, data: parsed });
                    }
                    
                    // Check for access tokens
                    if (key.toLowerCase().includes('accesstoken') || parsed.credentialType === 'AccessToken') {
                        msalData.accessTokens.push({ key, data: parsed });
                        if (parsed.secret && isJWT(parsed.secret)) {
                            console.log(`  └─ Contains JWT in 'secret' field`);
                            allTokens.push({
                                source: 'localStorage (MSAL)',
                                key: key,
                                path: 'secret',
                                token: parsed.secret,
                                type: 'Access Token'
                            });
                        }
                    }
                    
                    // Check for ID tokens
                    if (key.toLowerCase().includes('idtoken') || parsed.credentialType === 'IdToken') {
                        msalData.idTokens.push({ key, data: parsed });
                        if (parsed.secret && isJWT(parsed.secret)) {
                            console.log(`  └─ Contains JWT in 'secret' field`);
                            allTokens.push({
                                source: 'localStorage (MSAL)',
                                key: key,
                                path: 'secret',
                                token: parsed.secret,
                                type: 'ID Token'
                            });
                        }
                    }
                    
                    // Check for refresh tokens
                    if (key.toLowerCase().includes('refreshtoken') || parsed.credentialType === 'RefreshToken') {
                        msalData.refreshTokens.push({ key, data: parsed });
                        if (parsed.secret) {
                            console.log(`  └─ Contains refresh token in 'secret' field`);
                        }
                    }
                    
                    // Recursively search for any JWTs in the object
                    const foundTokens = findJWTsInObject(parsed, '', [], 'localStorage (MSAL)', key);
                    foundTokens.forEach(token => {
                        if (!allTokens.find(t => t.token === token.token)) {
                            allTokens.push({ ...token, type: 'Unknown' });
                        }
                    });
                    
                    if (!key.toLowerCase().includes('accesstoken') && 
                        !key.toLowerCase().includes('idtoken') && 
                        !key.toLowerCase().includes('refreshtoken') &&
                        !key.toLowerCase().includes('account')) {
                        msalData.otherKeys.push({ key, data: parsed });
                    }
                    
                } catch (e) {
                    // Not JSON or parsing failed
                    msalData.otherKeys.push({ key, data: value });
                }
            }
        }
        
        // Check sessionStorage for MSAL keys
        console.log('\n📦 Checking sessionStorage for MSAL data...');
        for (let i = 0; i < sessionStorage.length; i++) {
            const key = sessionStorage.key(i);
            
            if (key.toLowerCase().includes('msal') || 
                key.includes('login.windows.net') || 
                key.includes('login.microsoftonline.com') ||
                key.match(/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/i)) {
                
                const value = sessionStorage.getItem(key);
                console.log(`Found MSAL key: ${key}`);
                
                try {
                    const parsed = JSON.parse(value);
                    
                    // Check for tokens and recursively search
                    const foundTokens = findJWTsInObject(parsed, '', [], 'sessionStorage (MSAL)', key);
                    foundTokens.forEach(token => {
                        if (!allTokens.find(t => t.token === token.token)) {
                            allTokens.push({ ...token, type: 'Unknown' });
                        }
                    });
                    
                } catch (e) {
                    // Not JSON
                }
            }
        }
        
        // Display summary
        console.log('\n═══════════════════════════════════════════');
        console.log('📊 MSAL DISCOVERY SUMMARY');
        console.log('═══════════════════════════════════════════\n');
        
        console.log(`🔑 Accounts: ${msalData.accounts.length}`);
        console.log(`🎫 Access Tokens: ${msalData.accessTokens.length}`);
        console.log(`🆔 ID Tokens: ${msalData.idTokens.length}`);
        console.log(`🔄 Refresh Tokens: ${msalData.refreshTokens.length}`);
        console.log(`📋 Other MSAL Keys: ${msalData.otherKeys.length}`);
        console.log(`\n🎯 Total JWTs Found: ${allTokens.length}\n`);
        
        // Display decoded tokens
        if (allTokens.length > 0) {
            console.log('📊 Decoded JWT Tokens:\n');
            
            allTokens.forEach((item, index) => {
                const location = item.path 
                    ? `${item.source}["${item.key}"].${item.path}`
                    : `${item.source}["${item.key}"]`;
                    
                console.groupCollapsed(`Token ${index + 1} [${item.type}] from ${location}`);
                
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
        }
        
        // Display account details
        if (msalData.accounts.length > 0) {
            console.log('\n👤 MSAL Accounts:\n');
            msalData.accounts.forEach((account, index) => {
                console.groupCollapsed(`Account ${index + 1}: ${account.data.username || account.data.name || 'Unknown'}`);
                console.log('Key:', account.key);
                console.log('Data:', account.data);
                console.groupEnd();
            });
        }
        
        console.groupEnd();
        
        return {
            accounts: msalData.accounts,
            accessTokens: msalData.accessTokens,
            idTokens: msalData.idTokens,
            refreshTokens: msalData.refreshTokens,
            otherKeys: msalData.otherKeys,
            decodedTokens: allTokens
        };
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
    console.log('Commands: findJWTTokens(), findMSALTokens(), decodeJWT(token), findAuthHeaders()');
})();
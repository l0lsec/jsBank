# JSBank - Penetration Testing Toolkit

A comprehensive browser-based JavaScript toolkit for security testing and reconnaissance. Load a single script into your browser console to access powerful pentesting utilities.

> ⚠️ **For educational and authorized testing purposes only**  
> Only use this toolkit on systems you own or have explicit permission to test.

## 🚀 Quick Start

1. Copy the contents of `JSBank.js`
2. Open your browser's Developer Console (F12)
3. Paste and execute the script
4. Type `pentestHelp()` to see all available commands

```javascript
// In browser console
pentestHelp()  // Display command reference
```

## 📚 Available Tools

### 🔍 RECONNAISSANCE

#### Variable & Object Inspection
- `inspectVariables()` - Inspect all user-defined global JavaScript variables
- `inspectVariables({ showWindow: true })` - Include window properties
- `inspectVariables({ filterPattern: "user" })` - Filter by pattern
- `inspectVariables({ obj: myObject })` - Inspect specific object
- `listAllGlobals()` - Quick list of all global variable names
- `inspectStorage()` - View localStorage and sessionStorage contents

#### API & Endpoint Discovery
- `findAPIEndpoints()` - Discover ALL URLs, endpoints, and GraphQL operations
- `findAPIEndpoints({ includeExternalResources: true })` - Include static resources
- `findAllHrefLinks()` - Discover and categorize all href links
- `extractAllURLs()` - Extract and categorize all URLs from page source

#### GraphQL Testing
- `testGraphQLIntrospection(endpoint)` - Test if GraphQL introspection is enabled
- `testGraphQLIntrospection("/graphql", { tryAlternatives: false })` - Quick introspection test
- `enumerateGraphQLSchema(endpoint)` - Enumerate schema when introspection is blocked
- `enumerateGraphQLSchema("/graphql", { probeSubfields: true })` - Auto-probe complex fields
- `probeGraphQLSubfields(endpoint, "fieldName")` - Discover subfields of complex types

#### DOM & Form Analysis
- `findAllForms()` - Find all forms and their fields
- `findHiddenFields()` - Find hidden input fields and CSS-hidden elements
- `findDataAttributes()` - Find all data-* attributes
- `findEventListeners()` - Find all event listeners on the page

#### Sensitive Data Discovery
- `scanSensitiveData()` - Scan DOM, storage, and logs for potential secrets
- `scanSensitiveData({ customPatterns })` - Add custom regex signatures to the scanner

### 🎯 XSS TESTING

- `testXSSInputs()` - Test all input fields with XSS payloads
- `testXSSInputs({ autoSubmit: true })` - Test with automatic form submission
- `testXSSInputs({ clearAfter: false })` - Keep payloads in fields
- `testURLXSS()` - Test URL parameters for XSS reflection
- `findXSSSinks()` - Find potential XSS injection points (innerHTML, event handlers, etc.)

### 🛡️ SECURITY ANALYSIS

#### Headers & Cookies
- `checkSecurityHeaders()` - Check HTTP security headers (CSP, HSTS, X-Frame-Options, etc.)
- `inspectCookies()` - Analyze cookie security and detect session tokens
- `testCookieManipulation(name, value)` - Test cookie manipulation

#### CSRF Analysis
- `analyzeCSRFProtection()` - Score each form for CSRF defenses
- `replayFormWithoutCSRF(index, options)` - Resubmit forms with tokens stripped/modified

#### JWT Tokens
- `findJWTTokens()` - Find and decode JWT tokens in storage, cookies, and JSON objects (searches for accessToken, idToken, refreshToken, and more)
- `findMSALTokens()` - Find Microsoft MSAL (Microsoft Authentication Library) tokens, accounts, and credentials
- `decodeJWT(token)` - Decode a specific JWT token
- `findAuthHeaders()` - Instructions for discovering authorization headers
- `jwtLab.forgeNoneVariant(token, overrides)` - Build `alg:none` test tokens
- `jwtLab.modifyClaims(token, claims)` - Tamper with payload claims
- `jwtLab.replayRequestWithToken(logIndex, token, options)` - Replay captured requests with modified tokens

### 📊 MONITORING

- `showRequestLog()` - View all intercepted fetch/XHR requests
- `showFormLog()` - View all form submissions
- `clearLogs()` - Clear request and form logs
- `showRealtimeLog()` - Inspect WebSocket/EventSource traffic
- `listRealtimeChannels()` - List active realtime channels with IDs
- `injectWebSocketMessage(id, payload)` - Send custom frames into a captured WebSocket
- `closeRealtimeChannel(id, code, reason)` - Close a WebSocket/EventSource cleanly
- `clearRealtimeLog()` - Clear realtime channel logs

## 💡 Usage Examples

### Basic Reconnaissance
```javascript
// Get overview of page variables
listAllGlobals()

// Find all API endpoints and URLs
findAPIEndpoints()

// Check security headers
checkSecurityHeaders()

// Find JWT tokens
findJWTTokens()

// Find Microsoft MSAL tokens
findMSALTokens()
```

### XSS Testing
```javascript
// Test all inputs for XSS
testXSSInputs()

// Check URL parameters
testURLXSS()

// Find potential injection points
findXSSSinks()
```

### GraphQL Testing
```javascript
// Test introspection
testGraphQLIntrospection('/graphql')

// Enumerate schema if introspection is disabled
enumerateGraphQLSchema('/graphql', { 
    probeSubfields: true,
    delay: 100 
})

// Probe specific field
probeGraphQLSubfields('/graphql', 'users')
```

### Form & Data Analysis
```javascript
// Find all forms
findAllForms()

// Find hidden fields
findHiddenFields()

// Monitor form submissions
showFormLog()
```

### Network Monitoring
```javascript
// View intercepted requests
showRequestLog()

// Requests are automatically logged when the script loads
// Make some requests on the page, then:
showRequestLog()
```

### CSRF Validation
```javascript
// Score all forms for CSRF defenses
analyzeCSRFProtection()

// Replay the first form without its token to test enforcement
await replayFormWithoutCSRF(0)
```

### Realtime Channel Testing
```javascript
// Watch WebSocket/EventSource traffic live
listRealtimeChannels()
showRealtimeLog()

// Inject a custom payload into a captured WebSocket (use returned ID)
injectWebSocketMessage('ws-1', JSON.stringify({ op: 'ping' }))
```

### Sensitive Data Sweep
```javascript
// Run default signatures
scanSensitiveData()

// Add custom regex patterns
scanSensitiveData({
    customPatterns: [
        { name: 'Internal Project Code', regex: /PRJ-[0-9]{4}/g, severity: 'info' }
    ]
})
```

### JWT Tampering
```javascript
// Finds JWTs in storage, cookies, and nested JSON objects
// Automatically searches for: accessToken, idToken, refreshToken, 
// access_token, id_token, refresh_token, token, jwt, secret, etc.
const tokens = findJWTTokens()

// Example output shows location: sessionStorage["AuthUser"].idToken
const forged = jwtLab.forgeNoneVariant(tokens[0].token, { role: 'admin' })

// Replay the first captured request with the forged token
await jwtLab.replayRequestWithToken(0, forged)
```

### MSAL Token Discovery
```javascript
// Find all Microsoft Authentication Library (MSAL) tokens
// Detects: MSAL accounts, access tokens, ID tokens, refresh tokens
// Searches localStorage and sessionStorage for MSAL-specific keys
const msalData = findMSALTokens()

// Returns structured data:
// - accounts: MSAL account objects
// - accessTokens: Access tokens with decoded JWTs
// - idTokens: ID tokens with decoded JWTs  
// - refreshTokens: Refresh token credentials
// - decodedTokens: All discovered JWTs with full details

// Access specific token types
console.log(msalData.accounts)       // User accounts
console.log(msalData.accessTokens)   // Access tokens
console.log(msalData.idTokens)       // ID tokens
console.log(msalData.decodedTokens)  // All JWTs found
```

## 🔧 Features

### Automatic Request Interception
The toolkit automatically intercepts:
- `fetch()` requests
- `XMLHttpRequest` calls
- Form submissions

All intercepted data is logged and can be viewed with `showRequestLog()` and `showFormLog()`.

### Comprehensive URL Discovery
The `findAPIEndpoints()` function discovers:
- All HTTP/HTTPS URLs in page source
- Relative endpoint paths
- GraphQL operations and queries
- API endpoints (categorized)
- Internal vs external URLs
- REST-like endpoints

### GraphQL Enumeration
Advanced GraphQL testing capabilities:
- Full introspection testing
- Partial introspection detection
- Field suggestion discovery
- Schema enumeration without introspection
- Automatic subfield probing
- Common field name testing

### Smart Cookie Analysis
- Detects authentication cookies
- Shows cookie details and security flags
- Provides recommendations for secure cookie usage

### Realtime Channel Monitoring
- Hooks WebSocket and EventSource traffic
- Provides channel IDs for injection/closure
- Logs inbound/outbound frames for auditing

### CSRF Auditor & Replay Helper
- Scores forms for CSRF indicators (tokens, methods, origin)
- Replays original submissions with tokens removed/overridden
- Highlights forms that need server-side review

### Sensitive Data Scanner
- Sweeps DOM text, inline scripts, storage, and captured requests
- Built-in signatures for API keys, JWTs, bearer tokens, emails, private IPs
- Accepts custom regex patterns for environment-specific secrets

### JWT Tampering Lab
- Generates `alg:none` variants automatically
- Modifies claims (roles, expiration, etc.) without re-copying boilerplate
- Replays captured requests with forged tokens straight from the log

### MSAL Token Discovery
- Automatically detects Microsoft Authentication Library (MSAL) storage patterns
- Identifies MSAL accounts, access tokens, ID tokens, and refresh tokens
- Searches for keys containing 'msal', 'login.windows.net', or 'login.microsoftonline.com'
- Extracts and decodes JWTs from MSAL credential objects
- Provides structured output with token types and account information

## 📦 Module Structure

JSBank combines multiple specialized modules:

1. **VarInspector** - Variable and object inspection
2. **Recon** - DOM, endpoint, and GraphQL reconnaissance
3. **XSS** - Cross-site scripting testing utilities
4. **HeadCookieInspector** - Security headers and cookie analysis
5. **FormDataNetworkRequest** - Form and network request logging
6. **JWT** - JWT token discovery and decoding

All modules are bundled into a single `JSBank.js` file for easy deployment.

## 🛠️ Advanced Usage

### Custom XSS Payloads
```javascript
const customPayloads = [
    '<img src=x onerror=alert(document.domain)>',
    '<svg onload=alert(document.cookie)>',
    // ... your payloads
];

testXSSInputs({ payloads: customPayloads })
```

### Filtered Variable Inspection
```javascript
// Find all variables containing "auth"
inspectVariables({ filterPattern: "auth" })

// Inspect specific object deeply
inspectVariables({ obj: window.myApp })
```

### GraphQL Schema Enumeration Options
```javascript
enumerateGraphQLSchema('/graphql', {
    testMutations: true,        // Test mutation fields
    testSubscriptions: false,    // Skip subscriptions
    customFields: ['myField'],   // Add custom field names to test
    delay: 100,                  // Delay between requests (ms)
    probeSubfields: true         // Automatically probe complex fields
})
```

## 🔒 Security Considerations

- **Authorization Required**: Only use on systems you own or have permission to test
- **Non-Destructive**: Most functions are read-only and non-invasive
- **Rate Limiting**: Use `delay` parameters to avoid triggering rate limits
- **Legal Compliance**: Ensure compliance with applicable laws and regulations

## 🐛 Troubleshooting

### Script Not Loading
- Ensure you copied the entire `JSBank.js` file
- Check browser console for errors
- Try refreshing the page and reloading

### Functions Not Working
- Verify the page is fully loaded
- Check if Content Security Policy (CSP) is blocking execution
- Try in an incognito/private window

### GraphQL Enumeration Slow
- Increase the `delay` parameter to avoid rate limiting
- Use `probeSubfields: false` to skip automatic probing
- Test fewer fields with `customFields` option

## 📝 Output Examples

### Security Headers Check
```
🛡️ Security Headers Check
✅ Content Security Policy: default-src 'self'
❌ X-Frame-Options: MISSING
✅ HTTP Strict Transport Security (HSTS): max-age=31536000
```

### JWT Token Discovery
```
🔑 JWT Token Discovery
Found potential JWT in localStorage["auth_token"]

📊 Decoded Tokens (1):
  Header: { alg: "HS256", typ: "JWT" }
  Payload: { sub: "1234567890", name: "John Doe", iat: 1516239022 }
  ⏰ Expiration: 12/31/2024, 11:59:59 PM
  ✅ Token is still valid
```

### MSAL Token Discovery
```
🔐 MSAL Token Discovery

📦 Checking localStorage for MSAL data...
Found MSAL key: d2fb3cf0-bb11-4a9f-8ee0-5014b70b21ab.4aaa468e-93ba-4ee3-ab9f-6a247aa3ade0-login.windows.net-accesstoken-...
  └─ Contains JWT in 'secret' field
Found MSAL key: msal.account.keys
Found MSAL key: msal.token.keys.{clientId}

═══════════════════════════════════════════
📊 MSAL DISCOVERY SUMMARY
═══════════════════════════════════════════

🔑 Accounts: 2
🎫 Access Tokens: 3
🆔 ID Tokens: 2
🔄 Refresh Tokens: 1
📋 Other MSAL Keys: 5

🎯 Total JWTs Found: 5

📊 Decoded JWT Tokens:
Token 1 [Access Token] from localStorage (MSAL)["..."].secret
  Header: { typ: "JWT", alg: "RS256", kid: "..." }
  Payload: { aud: "...", iss: "https://sts.windows.net/...", ... }
  ⏰ Expiration: 11/25/2025, 3:30:00 PM
  ✅ Token is still valid

👤 MSAL Accounts:
Account 1: user@example.com
  homeAccountId: d2fb3cf0-bb11-4a9f-8ee0-5014b70b21ab
  username: user@example.com
  name: John Doe
```

### API Endpoint Discovery
```
🌐 Complete URL & Endpoint Discovery
🔌 API Endpoints (5)
  https://api.example.com/v1/users
  https://api.example.com/v1/posts
  ...
📁 Relative Endpoints (3)
  /api/login
  /api/logout
  /api/profile
```

## 🤝 Contributing

This is a personal pentesting toolkit. Feel free to fork and customize for your needs.

## 📄 License

For educational and authorized testing purposes only.

## ⚡ Tips & Best Practices

1. **Start with reconnaissance** - Run `listAllGlobals()` and `findAPIEndpoints()` first
2. **Check security basics** - Use `checkSecurityHeaders()` and `inspectCookies()` early
3. **Monitor traffic** - Let the script run while you navigate to capture all requests
4. **Test incrementally** - Start with non-invasive tests before trying XSS payloads
5. **Document findings** - Copy console output for your security reports
6. **Respect rate limits** - Use delay parameters when testing APIs

## 📞 Common Workflows

### Web App Security Assessment
```javascript
// 1. Load toolkit
pentestHelp()

// 2. Basic reconnaissance
listAllGlobals()
findAPIEndpoints()
checkSecurityHeaders()

// 3. Authentication analysis
findJWTTokens()
findMSALTokens()  // For Microsoft-authenticated apps
inspectCookies()

// 4. Form analysis
findAllForms()
findHiddenFields()

// 5. Monitor traffic
// (Navigate the app)
showRequestLog()
showFormLog()
```

### GraphQL API Testing
```javascript
// 1. Test introspection
testGraphQLIntrospection('/graphql')

// 2. If blocked, enumerate manually
const schema = await enumerateGraphQLSchema('/graphql', {
    probeSubfields: true,
    delay: 100
})

// 3. Test discovered fields
probeGraphQLSubfields('/graphql', 'users')
```

### XSS Vulnerability Testing
```javascript
// 1. Find potential sinks
findXSSSinks()

// 2. Test URL parameters
testURLXSS()

// 3. Test input fields
testXSSInputs()

// 4. Check for reflected parameters
// (Review console output for reflections)
```

### CSRF Enforcement Testing
```javascript
// 1. Enumerate forms and score protections
analyzeCSRFProtection()

// 2. Replay interesting forms without/with modified tokens
await replayFormWithoutCSRF(2, { overrides: { amount: '9999' } })

// 3. Review server-side behavior and log results
showRequestLog({ urlIncludes: '/transfer' })
```

### JWT Authorization Drift
```javascript
// 1. Capture some authenticated traffic
showRequestLog()

// 2. Forge a token that elevates privileges
const forged = jwtLab.modifyClaims(existingToken, { role: 'super-admin' })

// 3. Replay the captured request with the new token
await jwtLab.replayRequestWithToken(3, forged)
```

### Microsoft Azure/MSAL Application Testing
```javascript
// 1. Discover all MSAL tokens and accounts
const msalData = findMSALTokens()

// 2. View account information
console.table(msalData.accounts)

// 3. Extract and decode access tokens
msalData.accessTokens.forEach(token => {
    console.log('Access Token:', token.key)
    if (token.data.secret) {
        decodeJWT(token.data.secret)
    }
})

// 4. Check ID tokens
msalData.idTokens.forEach(token => {
    console.log('ID Token:', token.key)
    if (token.data.secret) {
        decodeJWT(token.data.secret)
    }
})

// 5. Test with modified tokens (combine with JWT tampering)
const msalTokens = findMSALTokens()
if (msalTokens.decodedTokens.length > 0) {
    const forged = jwtLab.modifyClaims(
        msalTokens.decodedTokens[0].token, 
        { roles: ['Admin'] }
    )
    await jwtLab.replayRequestWithToken(0, forged)
}
```

---

**Version**: 1.0  
**Last Updated**: November 2025  

Happy (ethical) hacking! 🔐


// ====================================
// DOM Manipulation & Event Inspector
// ====================================

(function() {
    'use strict';
    
    /**
     * Find all event listeners on the page
     */
    window.findEventListeners = function(element = document) {
        console.group('👂 Event Listener Discovery');
        
        const elements = element.querySelectorAll('*');
        const listenersFound = [];
        
        elements.forEach(el => {
            const events = getEventListeners(el); // Chrome DevTools API
            if (Object.keys(events).length > 0) {
                listenersFound.push({ element: el, events });
            }
        });
        
        console.log(`Found ${listenersFound.length} elements with event listeners\n`);
        
        listenersFound.forEach(({ element, events }) => {
            console.groupCollapsed(`${element.tagName}${element.id ? '#' + element.id : ''}${element.className ? '.' + element.className.split(' ')[0] : ''}`);
            console.log('Element:', element);
            console.log('Events:', events);
            console.groupEnd();
        });
        
        console.groupEnd();
        return listenersFound;
    };
    
    /**
     * Find hidden fields and inputs
     */
    window.findHiddenFields = function() {
        console.group('🙈 Hidden Fields Discovery');
        
        const hiddenInputs = document.querySelectorAll('input[type="hidden"]');
        console.log(`Found ${hiddenInputs.length} hidden input(s)\n`);
        
        hiddenInputs.forEach(input => {
            console.log(`Name: ${input.name}, Value: ${input.value}`);
        });
        
        // Find elements hidden via CSS
        const hiddenElements = Array.from(document.querySelectorAll('*'))
            .filter(el => {
                const style = window.getComputedStyle(el);
                return style.display === 'none' || style.visibility === 'hidden';
            });
        
        console.log(`\nFound ${hiddenElements.length} CSS-hidden elements`);
        
        console.groupEnd();
        return { hiddenInputs, hiddenElements };
    };
    
    /**
     * Find data attributes
     */
    window.findDataAttributes = function() {
        console.group('📊 Data Attributes Discovery');
        
        const elementsWithData = Array.from(document.querySelectorAll('*'))
            .filter(el => {
                return Array.from(el.attributes).some(attr => attr.name.startsWith('data-'));
            });
        
        console.log(`Found ${elementsWithData.length} element(s) with data attributes\n`);
        
        elementsWithData.forEach(el => {
            const dataAttrs = {};
            Array.from(el.attributes).forEach(attr => {
                if (attr.name.startsWith('data-')) {
                    dataAttrs[attr.name] = attr.value;
                }
            });
            
            console.groupCollapsed(`${el.tagName}${el.id ? '#' + el.id : ''}`);
            console.log('Element:', el);
            console.log('Data attributes:', dataAttrs);
            console.groupEnd();
        });
        
        console.groupEnd();
        return elementsWithData;
    };
    
    /**
     * Find all API endpoints mentioned in the page
     */
    window.findAPIEndpoints = function(options = {}) {
        const { 
            includeExternalResources = false,
            categorize = true 
        } = options;
        
        console.group('🌐 Complete URL & Endpoint Discovery');
        
        const allURLs = new Set();
        const relativeEndpoints = new Set();
        const graphqlOps = new Set();
        
        const pageSource = document.documentElement.innerHTML;
        const scriptContent = Array.from(document.querySelectorAll('script'))
            .map(s => s.textContent)
            .join('\n');
        
        // Combine all text content for comprehensive search
        const allContent = pageSource + '\n' + scriptContent;
        
        // === DISCOVER ALL HTTP/HTTPS URLs ===
        console.log('\n🔍 Discovering ALL HTTP/HTTPS URLs...\n');
        
        // Universal HTTP/HTTPS URL matcher - captures everything
        const universalURLRegex = /https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&\/=]*)/gi;
        
        let urlMatch;
        const urlRegex = new RegExp(universalURLRegex);
        while ((urlMatch = urlRegex.exec(allContent)) !== null) {
            let url = urlMatch[0];
            // Clean up common trailing characters that aren't part of URLs
            url = url.replace(/[,;.!?)}\]"'`\\]+$/, '');
            // Remove HTML entities at the end
            url = url.replace(/&[a-z]+;?$/i, '');
            allURLs.add(url);
        }
        
        // Also check for URLs in specific attributes and href links
        document.querySelectorAll('a[href], img[src], script[src], link[href], iframe[src], video[src], audio[src], source[src], embed[src], area[href], base[href]').forEach(el => {
            const url = el.href || el.src;
            if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
                allURLs.add(url);
            }
        });
        
        // Also check raw href attributes (in case computed href differs)
        document.querySelectorAll('[href], [src]').forEach(el => {
            const href = el.getAttribute('href');
            const src = el.getAttribute('src');
            const url = href || src;
            if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
                allURLs.add(url);
            }
        });
        
        // Check all data attributes
        document.querySelectorAll('*').forEach(el => {
            Array.from(el.attributes).forEach(attr => {
                if (attr.name.startsWith('data-')) {
                    const value = attr.value;
                    if (value && (value.startsWith('http://') || value.startsWith('https://'))) {
                        allURLs.add(value);
                    }
                }
            });
        });
        
        // === DISCOVER RELATIVE ENDPOINTS ===
        console.log('🔍 Discovering relative endpoint paths...\n');
        
        // Find all relative paths that look like endpoints (starting with /)
        const relativePaths = [
            // Quoted paths
            /["'`](\/(?:api|graphql|v\d+|auth|login|register|oauth|token|users?|posts?|products?|items?|data|search|admin|dashboard)[^"'`\s]*)["'`]/gi,
            // Paths in fetch/axios
            /(?:fetch|axios)\s*\.\s*(?:get|post|put|delete|patch)?\s*\(\s*["'`](\/[^"'`\s]+)["'`]/gi,
            // Any path starting with / in quotes
            /["'`](\/[a-zA-Z0-9_\-\/]+(?:\?[^"'`\s]*)?)["'`]/gi,
        ];
        
        relativePaths.forEach(pattern => {
            const regex = new RegExp(pattern);
            let match;
            while ((match = regex.exec(allContent)) !== null) {
                let path = match[1];
                // Filter out common non-endpoint paths
                if (!path.match(/\.(jpg|jpeg|png|gif|svg|css|js|woff|woff2|ttf|eot|ico|webp|mp4|webm|pdf)$/i) &&
                    !path.startsWith('//')) {
                    relativeEndpoints.add(path);
                }
            }
        });
        
        // Check form actions
        document.querySelectorAll('form[action]').forEach(form => {
            const action = form.getAttribute('action');
            if (action && !action.startsWith('http') && action !== '#' && action !== '') {
                relativeEndpoints.add(action);
            }
        });
        
        // Check all href attributes for relative paths
        document.querySelectorAll('a[href], area[href], link[href]').forEach(el => {
            const href = el.getAttribute('href');
            if (href && href.startsWith('/') && !href.startsWith('//')) {
                // Filter out common static file extensions unless they might be data endpoints
                if (!href.match(/\.(jpg|jpeg|png|gif|svg|css|js|woff|woff2|ttf|eot|ico|webp|mp4|webm|pdf)$/i) ||
                    href.match(/\.(json|xml)$/i)) {
                    relativeEndpoints.add(href);
                }
            }
        });
        
        // Find fetch/axios calls with any URL (variable or string)
        const fetchPatterns = [
            /fetch\s*\(\s*['"`]([^'"`]+)['"`]/gi,
            /axios\s*\.\s*(get|post|put|delete|patch|head|options)\s*\(\s*['"`]([^'"`]+)['"`]/gi,
            /\$\.(get|post|ajax)\s*\(\s*['"`]([^'"`]+)['"`]/gi, // jQuery
            /XMLHttpRequest.*open\s*\(\s*['"`]\w+['"`]\s*,\s*['"`]([^'"`]+)['"`]/gi,
        ];
        
        fetchPatterns.forEach(pattern => {
            let match;
            const regex = new RegExp(pattern);
            while ((match = regex.exec(scriptContent)) !== null) {
                const url = match[match.length - 1]; // Last capture group
                if (url.startsWith('http://') || url.startsWith('https://')) {
                    allURLs.add(url);
                } else if (url.startsWith('/')) {
                    relativeEndpoints.add(url);
                }
            }
        });
        
        // === GRAPHQL DISCOVERY ===
        console.log('🔍 Searching for GraphQL operations...\n');
        
        // Find GraphQL queries and mutations in page source
        const gqlOperationRegex = /(query|mutation|subscription)\s+(\w+)\s*(\([^)]*\))?\s*\{/gi;
        let opMatch;
        while ((opMatch = gqlOperationRegex.exec(scriptContent)) !== null) {
            const opType = opMatch[1];
            const opName = opMatch[2];
            graphqlOps.add(`${opType} ${opName}`);
        }
        
        // Find GraphQL operations in template literals
        const gqlTemplateRegex = /gql`\s*(query|mutation|subscription)\s+(\w+)/gi;
        let templateMatch;
        while ((templateMatch = gqlTemplateRegex.exec(scriptContent)) !== null) {
            graphqlOps.add(`${templateMatch[1]} ${templateMatch[2]}`);
        }
        
        // Find GraphQL operations in strings
        const gqlStringRegex = /["']\s*(query|mutation|subscription)\s+(\w+)/gi;
        let stringMatch;
        while ((stringMatch = gqlStringRegex.exec(scriptContent)) !== null) {
            graphqlOps.add(`${stringMatch[1]} ${stringMatch[2]}`);
        }
        
        // Check for __typename (indicator of GraphQL usage)
        if (scriptContent.includes('__typename')) {
            console.log('⚠️  GraphQL detected: Found __typename in page source');
        }
        
        // Check for Apollo Client or other GraphQL libraries
        const graphqlLibraries = [
            { name: 'Apollo Client', indicators: ['ApolloClient', 'apolloClient', '@apollo/client'] },
            { name: 'Relay', indicators: ['RelayEnvironment', 'graphql`'] },
            { name: 'URQL', indicators: ['urql', 'createClient'] },
            { name: 'GraphQL Request', indicators: ['graphql-request', 'GraphQLClient'] },
        ];
        
        graphqlLibraries.forEach(lib => {
            if (lib.indicators.some(indicator => scriptContent.includes(indicator))) {
                console.log(`📦 GraphQL library detected: ${lib.name}`);
            }
        });
        
        // === CATEGORIZE URLS ===
        const categorized = {
            api: new Set(),
            graphql: new Set(),
            rest: new Set(),
            static: new Set(),
            external: new Set(),
            internal: new Set(),
            other: new Set()
        };
        
        if (categorize) {
            console.log('\n📊 Categorizing URLs...\n');
            
            allURLs.forEach(url => {
                try {
                    const urlObj = new URL(url);
                    const pathname = urlObj.pathname.toLowerCase();
                    const hostname = urlObj.hostname;
                    
                    // Check if internal or external
                    if (hostname === window.location.hostname) {
                        categorized.internal.add(url);
                    } else {
                        categorized.external.add(url);
                    }
                    
                    // Categorize by type
                    if (pathname.includes('/graphql') || pathname.includes('graphql')) {
                        categorized.graphql.add(url);
                    } else if (pathname.includes('/api/') || pathname.includes('/api')) {
                        categorized.api.add(url);
                    } else if (pathname.match(/\/(v\d+|users?|posts?|products?|items?|auth|login|register|oauth|token|data|search)\//)) {
                        categorized.rest.add(url);
                    } else if (pathname.match(/\.(jpg|jpeg|png|gif|svg|css|js|woff|woff2|ttf|eot|ico|webp|mp4|webm|pdf)$/i)) {
                        if (!includeExternalResources) {
                            return; // Skip static resources unless explicitly requested
                        }
                        categorized.static.add(url);
                    } else if (pathname.match(/\.(json|xml|php|asp|aspx|jsp)$/i)) {
                        categorized.api.add(url); // Likely data endpoints
                    } else {
                        categorized.other.add(url);
                    }
                } catch (e) {
                    // Invalid URL, skip
                }
            });
        }
        
        // === DISPLAY RESULTS ===
        console.log('\n═══════════════════════════════════════════');
        console.log('📊 DISCOVERY RESULTS');
        console.log('═══════════════════════════════════════════\n');
        
        console.log(`🌐 Total HTTP/HTTPS URLs: ${allURLs.size}`);
        console.log(`📁 Total Relative Endpoints: ${relativeEndpoints.size}`);
        console.log(`🔍 Total GraphQL Operations: ${graphqlOps.size}\n`);
        
        if (categorize) {
            // API Endpoints
            if (categorized.api.size > 0) {
                console.group(`🔌 API Endpoints (${categorized.api.size})`);
                Array.from(categorized.api).sort().forEach(url => console.log('  ', url));
                console.groupEnd();
                console.log('');
            }
            
            // GraphQL Endpoints
            if (categorized.graphql.size > 0) {
                console.group(`📡 GraphQL Endpoints (${categorized.graphql.size})`);
                Array.from(categorized.graphql).sort().forEach(url => console.log('  ', url));
                console.groupEnd();
                console.log('');
            }
            
            // REST-like Endpoints
            if (categorized.rest.size > 0) {
                console.group(`🔄 REST-like Endpoints (${categorized.rest.size})`);
                Array.from(categorized.rest).sort().forEach(url => console.log('  ', url));
                console.groupEnd();
                console.log('');
            }
            
            // Internal URLs
            if (categorized.internal.size > 0) {
                console.group(`🏠 Internal URLs (${categorized.internal.size})`);
                const internal = Array.from(categorized.internal).sort();
                internal.slice(0, 20).forEach(url => console.log('  ', url));
                if (internal.length > 20) {
                    console.log(`  ... and ${internal.length - 20} more`);
                }
                console.groupEnd();
                console.log('');
            }
            
            // External URLs
            if (categorized.external.size > 0) {
                console.group(`🌍 External URLs (${categorized.external.size})`);
                const external = Array.from(categorized.external).sort();
                external.slice(0, 20).forEach(url => console.log('  ', url));
                if (external.length > 20) {
                    console.log(`  ... and ${external.length - 20} more`);
                }
                console.groupEnd();
                console.log('');
            }
            
            // Other URLs
            if (categorized.other.size > 0) {
                console.group(`📄 Other URLs (${categorized.other.size})`);
                const other = Array.from(categorized.other).sort();
                other.slice(0, 20).forEach(url => console.log('  ', url));
                if (other.length > 20) {
                    console.log(`  ... and ${other.length - 20} more`);
                }
                console.groupEnd();
                console.log('');
            }
            
            // Static Resources (if included)
            if (includeExternalResources && categorized.static.size > 0) {
                console.group(`🖼️  Static Resources (${categorized.static.size})`);
                console.log('  (First 10 shown)');
                Array.from(categorized.static).sort().slice(0, 10).forEach(url => console.log('  ', url));
                console.groupEnd();
                console.log('');
            }
        } else {
            // Show all URLs without categorization
            console.group(`All URLs (${allURLs.size})`);
            Array.from(allURLs).sort().forEach(url => console.log('  ', url));
            console.groupEnd();
            console.log('');
        }
        
        // Relative Endpoints
        if (relativeEndpoints.size > 0) {
            console.group(`📁 Relative Endpoints (${relativeEndpoints.size})`);
            Array.from(relativeEndpoints).sort().forEach(path => console.log('  ', path));
            console.groupEnd();
            console.log('');
        }
        
        // GraphQL Operations
        if (graphqlOps.size > 0) {
            console.group(`🔍 GraphQL Operations (${graphqlOps.size})`);
            Array.from(graphqlOps).sort().forEach(op => console.log('  ', op));
            console.groupEnd();
            console.log('');
        }
        
        console.groupEnd();
        
        return {
            allURLs: Array.from(allURLs),
            relativeEndpoints: Array.from(relativeEndpoints),
            graphqlOperations: Array.from(graphqlOps),
            categorized: categorize ? {
                api: Array.from(categorized.api),
                graphql: Array.from(categorized.graphql),
                rest: Array.from(categorized.rest),
                internal: Array.from(categorized.internal),
                external: Array.from(categorized.external),
                static: Array.from(categorized.static),
                other: Array.from(categorized.other)
            } : null
        };
    };
    
    /**
     * Discover all href links on the page
     */
    window.findAllHrefLinks = function(options = {}) {
        const {
            includeFragments = true,
            includeJavascript = true,
            includeMailto = true,
            includeTel = true,
            categorize = true
        } = options;
        
        console.group('🔗 Complete Href Link Discovery');
        
        const allHrefs = new Set();
        const linkData = [];
        
        // Find all elements with href attribute
        const hrefElements = document.querySelectorAll('a[href], link[href], area[href], base[href]');
        
        console.log(`\n📊 Found ${hrefElements.length} elements with href attribute\n`);
        
        hrefElements.forEach((el, index) => {
            const href = el.getAttribute('href');
            const computedHref = el.href; // Resolved absolute URL
            
            if (!href) return;
            
            // Filter based on options
            if (!includeFragments && href.startsWith('#')) return;
            if (!includeJavascript && href.startsWith('javascript:')) return;
            if (!includeMailto && href.startsWith('mailto:')) return;
            if (!includeTel && href.startsWith('tel:')) return;
            
            allHrefs.add(href);
            
            linkData.push({
                index: index + 1,
                element: el.tagName.toLowerCase(),
                href: href,
                absoluteURL: computedHref,
                text: el.textContent?.trim().substring(0, 50) || '(no text)',
                title: el.title || '',
                target: el.target || '',
                rel: el.rel || '',
                id: el.id || '',
                classes: el.className || ''
            });
        });
        
        if (categorize) {
            const categorized = {
                internal: [],
                external: [],
                relative: [],
                fragment: [],
                javascript: [],
                mailto: [],
                tel: [],
                api: [],
                file: [],
                other: []
            };
            
            linkData.forEach(link => {
                const href = link.href;
                
                // Categorize
                if (href.startsWith('#')) {
                    categorized.fragment.push(link);
                } else if (href.startsWith('javascript:')) {
                    categorized.javascript.push(link);
                } else if (href.startsWith('mailto:')) {
                    categorized.mailto.push(link);
                } else if (href.startsWith('tel:')) {
                    categorized.tel.push(link);
                } else if (href.startsWith('http://') || href.startsWith('https://')) {
                    try {
                        const url = new URL(href);
                        const pathname = url.pathname.toLowerCase();
                        
                        // Check if API endpoint
                        if (pathname.includes('/api/') || pathname.includes('/graphql') || 
                            pathname.match(/\.(json|xml)$/)) {
                            categorized.api.push(link);
                        }
                        // Check if file download
                        else if (pathname.match(/\.(pdf|doc|docx|xls|xlsx|zip|rar|tar|gz|exe|dmg|apk)$/i)) {
                            categorized.file.push(link);
                        }
                        // Check if same domain
                        else if (url.hostname === window.location.hostname) {
                            categorized.internal.push(link);
                        } else {
                            categorized.external.push(link);
                        }
                    } catch (e) {
                        categorized.other.push(link);
                    }
                } else if (href.startsWith('/') || href.startsWith('./') || href.startsWith('../')) {
                    categorized.relative.push(link);
                } else {
                    categorized.other.push(link);
                }
            });
            
            // Display categorized results
            console.log('\n═══════════════════════════════════════════');
            console.log('📊 HREF LINK ANALYSIS');
            console.log('═══════════════════════════════════════════\n');
            
            console.log(`🔗 Total Links: ${linkData.length}`);
            console.log(`📝 Unique Hrefs: ${allHrefs.size}\n`);
            
            // Internal Links
            if (categorized.internal.length > 0) {
                console.group(`🏠 Internal Links (${categorized.internal.length})`);
                categorized.internal.forEach(link => {
                    console.log(`[${link.element}] ${link.href}`);
                    console.log(`  Text: "${link.text}"`);
                    if (link.title) console.log(`  Title: "${link.title}"`);
                    if (link.target) console.log(`  Target: ${link.target}`);
                    console.log('');
                });
                console.groupEnd();
                console.log('');
            }
            
            // External Links
            if (categorized.external.length > 0) {
                console.group(`🌍 External Links (${categorized.external.length})`);
                categorized.external.forEach(link => {
                    console.log(`[${link.element}] ${link.href}`);
                    console.log(`  Text: "${link.text}"`);
                    if (link.rel) console.log(`  Rel: ${link.rel}`);
                    if (link.target) console.log(`  Target: ${link.target}`);
                    console.log('');
                });
                console.groupEnd();
                console.log('');
            }
            
            // Relative Links
            if (categorized.relative.length > 0) {
                console.group(`📁 Relative Links (${categorized.relative.length})`);
                categorized.relative.forEach(link => {
                    console.log(`[${link.element}] ${link.href}`);
                    console.log(`  Absolute: ${link.absoluteURL}`);
                    console.log(`  Text: "${link.text}"`);
                    console.log('');
                });
                console.groupEnd();
                console.log('');
            }
            
            // API Links
            if (categorized.api.length > 0) {
                console.group(`🔌 API/Data Links (${categorized.api.length})`);
                categorized.api.forEach(link => {
                    console.log(`[${link.element}] ${link.href}`);
                    console.log(`  Text: "${link.text}"`);
                    console.log('');
                });
                console.groupEnd();
                console.log('');
            }
            
            // File Downloads
            if (categorized.file.length > 0) {
                console.group(`📥 File Downloads (${categorized.file.length})`);
                categorized.file.forEach(link => {
                    console.log(`[${link.element}] ${link.href}`);
                    console.log(`  Text: "${link.text}"`);
                    console.log('');
                });
                console.groupEnd();
                console.log('');
            }
            
            // Fragment Links
            if (includeFragments && categorized.fragment.length > 0) {
                console.group(`#️⃣ Fragment/Anchor Links (${categorized.fragment.length})`);
                categorized.fragment.slice(0, 10).forEach(link => {
                    console.log(`${link.href} → "${link.text}"`);
                });
                if (categorized.fragment.length > 10) {
                    console.log(`... and ${categorized.fragment.length - 10} more`);
                }
                console.groupEnd();
                console.log('');
            }
            
            // JavaScript Links
            if (includeJavascript && categorized.javascript.length > 0) {
                console.group(`⚠️  JavaScript Links (${categorized.javascript.length})`);
                categorized.javascript.forEach(link => {
                    console.log(`[${link.element}] ${link.href.substring(0, 100)}`);
                    console.log(`  Text: "${link.text}"`);
                    console.log('');
                });
                console.groupEnd();
                console.log('');
            }
            
            // Mailto Links
            if (includeMailto && categorized.mailto.length > 0) {
                console.group(`📧 Email Links (${categorized.mailto.length})`);
                categorized.mailto.forEach(link => {
                    console.log(`${link.href} → "${link.text}"`);
                });
                console.groupEnd();
                console.log('');
            }
            
            // Tel Links
            if (includeTel && categorized.tel.length > 0) {
                console.group(`📱 Phone Links (${categorized.tel.length})`);
                categorized.tel.forEach(link => {
                    console.log(`${link.href} → "${link.text}"`);
                });
                console.groupEnd();
                console.log('');
            }
            
            // Other Links
            if (categorized.other.length > 0) {
                console.group(`❓ Other Links (${categorized.other.length})`);
                categorized.other.forEach(link => {
                    console.log(`[${link.element}] ${link.href}`);
                    console.log(`  Text: "${link.text}"`);
                    console.log('');
                });
                console.groupEnd();
                console.log('');
            }
            
            console.groupEnd();
            
            return {
                all: linkData,
                unique: Array.from(allHrefs),
                categorized: categorized,
                summary: {
                    total: linkData.length,
                    unique: allHrefs.size,
                    internal: categorized.internal.length,
                    external: categorized.external.length,
                    relative: categorized.relative.length,
                    api: categorized.api.length,
                    file: categorized.file.length,
                    fragment: categorized.fragment.length,
                    javascript: categorized.javascript.length,
                    mailto: categorized.mailto.length,
                    tel: categorized.tel.length,
                    other: categorized.other.length
                }
            };
            
        } else {
            // Simple list without categorization
            console.log('\n📋 All Links:\n');
            linkData.forEach(link => {
                console.log(`[${link.element}] ${link.href} → "${link.text}"`);
            });
            
            console.groupEnd();
            
            return {
                all: linkData,
                unique: Array.from(allHrefs)
            };
        }
    };
    
    /**
     * Test GraphQL introspection (often enabled in dev but should be disabled in prod)
     */
    window.testGraphQLIntrospection = async function(endpoint = '/graphql', options = {}) {
        const { verbose = true, tryAlternatives = true } = options;
        
        console.group('🔍 GraphQL Introspection & Schema Discovery Test');
        
        const results = {
            endpoint: endpoint,
            introspectionEnabled: false,
            partialIntrospection: false,
            fieldSuggestions: false,
            discoveredTypes: [],
            discoveredFields: [],
            errors: []
        };
        
        // Full introspection query
        const introspectionQuery = {
            query: `
                query IntrospectionQuery {
                    __schema {
                        queryType { name }
                        mutationType { name }
                        subscriptionType { name }
                        types {
                            name
                            kind
                            description
                            fields {
                                name
                                description
                                type {
                                    name
                                    kind
                                }
                            }
                        }
                    }
                }
            `
        };
        
        console.log(`\n🎯 Testing endpoint: ${endpoint}\n`);
        
        // Test 1: Full introspection
        try {
            console.log('📋 Test 1: Full introspection query...');
            
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(introspectionQuery)
            });
            
            const data = await response.json();
            
            if (data.data && data.data.__schema) {
                console.warn('⚠️  SECURITY ISSUE: Full GraphQL introspection is ENABLED!');
                console.log('Schema types found:', data.data.__schema.types.length);
                console.log('Query type:', data.data.__schema.queryType?.name);
                console.log('Mutation type:', data.data.__schema.mutationType?.name);
                console.log('Subscription type:', data.data.__schema.subscriptionType?.name);
                
                results.introspectionEnabled = true;
                results.discoveredTypes = data.data.__schema.types.map(t => t.name);
                
                if (verbose) {
                    console.log('\n📊 Full schema:', data.data.__schema);
                }
                
                console.groupEnd();
                return results;
            } else if (data.errors) {
                console.log('✅ Full introspection is blocked');
                if (verbose) {
                    console.log('Error message:', data.errors[0]?.message);
                }
                results.errors.push(data.errors[0]?.message);
            }
            
        } catch (e) {
            console.error('❌ Test 1 failed:', e.message);
            results.errors.push(e.message);
        }
        
        if (!tryAlternatives) {
            console.groupEnd();
            return results;
        }
        
        // Test 2: Partial introspection (just type names)
        try {
            console.log('\n📋 Test 2: Partial introspection (type names only)...');
            
            const partialQuery = {
                query: `{ __schema { types { name } } }`
            };
            
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(partialQuery)
            });
            
            const data = await response.json();
            
            if (data.data && data.data.__schema) {
                console.warn('⚠️  Partial introspection is enabled!');
                console.log('Types discovered:', data.data.__schema.types.map(t => t.name));
                results.partialIntrospection = true;
                results.discoveredTypes = data.data.__schema.types.map(t => t.name);
            } else {
                console.log('✅ Partial introspection also blocked');
            }
            
        } catch (e) {
            console.log('✅ Partial introspection blocked');
        }
        
        // Test 3: __type query (specific type introspection)
        try {
            console.log('\n📋 Test 3: Testing __type query (Query type)...');
            
            const typeQuery = {
                query: `{ __type(name: "Query") { name fields { name } } }`
            };
            
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(typeQuery)
            });
            
            const data = await response.json();
            
            if (data.data && data.data.__type) {
                console.warn('⚠️  __type queries are allowed!');
                console.log('Query fields:', data.data.__type.fields?.map(f => f.name));
                results.partialIntrospection = true;
                results.discoveredFields = data.data.__type.fields?.map(f => f.name) || [];
            } else {
                console.log('✅ __type queries blocked');
            }
            
        } catch (e) {
            console.log('✅ __type queries blocked');
        }
        
        // Test 4: Field suggestion via errors
        console.log('\n📋 Test 4: Testing for field suggestions in error messages...');
        
        const testQueries = [
            { query: `{ invalidFieldTest123 }`, purpose: 'Check for field suggestions' },
            { query: `{ __typename }`, purpose: 'Test __typename access' }
        ];
        
        for (const test of testQueries) {
            try {
                const response = await fetch(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ query: test.query })
                });
                
                const data = await response.json();
                
                if (data.errors && data.errors[0]) {
                    const errorMsg = data.errors[0].message;
                    
                    // Check if error suggests valid fields
                    if (errorMsg.includes('Did you mean') || 
                        errorMsg.includes('suggest') || 
                        errorMsg.includes('available fields')) {
                        console.warn('⚠️  Server provides field suggestions in errors!');
                        console.log('Error:', errorMsg);
                        results.fieldSuggestions = true;
                        
                        // Try to extract suggested fields
                        const fieldMatches = errorMsg.match(/["'](\w+)["']/g);
                        if (fieldMatches) {
                            const suggested = fieldMatches.map(m => m.replace(/["']/g, ''));
                            console.log('Suggested fields:', suggested);
                            results.discoveredFields.push(...suggested);
                        }
                    }
                }
                
                if (test.query.includes('__typename')) {
                    if (data.data && data.data.__typename) {
                        console.log('✅ __typename queries work:', data.data.__typename);
                    }
                }
                
            } catch (e) {
                // Silent fail
            }
        }
        
        // Test 5: Common query field enumeration
        console.log('\n📋 Test 5: Testing common GraphQL field names...');
        
        const commonFields = [
            'users', 'user', 'me', 'viewer', 'currentUser',
            'posts', 'post', 'articles', 'products', 'items',
            'search', 'query', 'data', 'info', 'status'
        ];
        
        const validFields = [];
        
        for (const field of commonFields) {
            try {
                const testQuery = { query: `{ ${field} }` };
                
                const response = await fetch(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(testQuery)
                });
                
                const data = await response.json();
                
                // If no "field doesn't exist" error, it might be valid
                if (data.errors) {
                    const errorMsg = data.errors[0]?.message || '';
                    if (!errorMsg.toLowerCase().includes('cannot query field') &&
                        !errorMsg.toLowerCase().includes('unknown field')) {
                        validFields.push(field);
                        console.log(`  ✓ Possible field: ${field} (${errorMsg.substring(0, 50)}...)`);
                    }
                } else if (data.data) {
                    validFields.push(field);
                    console.log(`  ✓ Valid field: ${field}`);
                }
                
            } catch (e) {
                // Silent fail
            }
        }
        
        if (validFields.length > 0) {
            console.warn(`⚠️  Discovered ${validFields.length} potential valid fields!`);
            results.discoveredFields.push(...validFields);
        } else {
            console.log('No common fields discovered');
        }
        
        // Summary
        console.log('\n═══════════════════════════════════════════');
        console.log('📊 SUMMARY');
        console.log('═══════════════════════════════════════════\n');
        
        if (results.introspectionEnabled) {
            console.warn('🚨 CRITICAL: Full introspection is enabled!');
            console.warn('   Entire schema is exposed - major security issue');
        } else if (results.partialIntrospection) {
            console.warn('⚠️  WARNING: Partial introspection is enabled');
            console.warn('   Some schema information is exposed');
        } else {
            console.log('✅ Introspection appears to be properly disabled');
        }
        
        if (results.fieldSuggestions) {
            console.warn('⚠️  WARNING: Field suggestions in errors enabled');
            console.warn('   Attackers can enumerate schema via error messages');
        }
        
        if (results.discoveredTypes.length > 0) {
            console.log(`\n📋 Discovered Types (${results.discoveredTypes.length}):`);
            console.log(results.discoveredTypes.slice(0, 20));
            if (results.discoveredTypes.length > 20) {
                console.log(`... and ${results.discoveredTypes.length - 20} more`);
            }
        }
        
        if (results.discoveredFields.length > 0) {
            console.log(`\n📋 Discovered Fields (${[...new Set(results.discoveredFields)].length}):`);
            console.log([...new Set(results.discoveredFields)]);
        }
        
        console.log('\n💡 RECOMMENDATIONS:');
        if (results.introspectionEnabled || results.partialIntrospection) {
            console.log('   • Disable introspection in production');
            console.log('   • Set introspection: false in Apollo Server config');
        }
        if (results.fieldSuggestions) {
            console.log('   • Disable field suggestions in error messages');
            console.log('   • Use generic error messages in production');
        }
        
        console.groupEnd();
        
        return results;
    };
    
    /**
     * Probe for subfields when a field requires them
     */
    window.probeGraphQLSubfields = async function(endpoint, fieldName, options = {}) {
        const {
            parentType = 'Query',
            isArray = false,
            maxDepth = 2,
            delay = 50
        } = options;
        
        console.group(`🔍 Probing subfields for: ${fieldName}`);
        
        const discoveredSubfields = {
            field: fieldName,
            typename: null,
            subfields: [],
            scalarFields: [],
            objectFields: []
        };
        
        // Step 1: Try to get __typename
        try {
            const typenameQuery = { 
                query: `{ ${fieldName} { __typename } }` 
            };
            
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(typenameQuery)
            });
            
            const data = await response.json();
            
            if (data.data && data.data[fieldName]) {
                const result = data.data[fieldName];
                const typename = isArray ? result[0]?.__typename : result.__typename;
                
                if (typename) {
                    discoveredSubfields.typename = typename;
                    console.log(`✅ Type discovered: ${typename}`);
                }
            } else if (data.errors) {
                // Check if error reveals the type
                const errorMsg = data.errors[0]?.message || '';
                const typeMatch = errorMsg.match(/type ["\']?(\w+)["\']?/i);
                if (typeMatch) {
                    discoveredSubfields.typename = typeMatch[1];
                    console.log(`📝 Type from error: ${typeMatch[1]}`);
                }
            }
            
        } catch (e) {
            console.log('Could not determine typename');
        }
        
        // Step 2: Test common scalar field names
        const commonScalarFields = [
            'id', 'name', 'title', 'description', 'email', 'username',
            'createdAt', 'updatedAt', 'date', 'timestamp',
            'status', 'type', 'value', 'count', 'total', 'amount',
            'url', 'slug', 'key', 'code', 'message', 'text',
            'isActive', 'isEnabled', 'isPublished', 'isDeleted',
            'firstName', 'lastName', 'fullName', 'displayName',
            'address', 'city', 'state', 'country', 'zipCode',
            'phone', 'mobile', 'age', 'price', 'quantity'
        ];
        
        console.log('\n🔍 Testing common scalar fields...\n');
        
        for (const subfield of commonScalarFields) {
            try {
                const testQuery = { 
                    query: `{ ${fieldName} { ${subfield} } }` 
                };
                
                const response = await fetch(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(testQuery)
                });
                
                const data = await response.json();
                
                if (!data.errors) {
                    // Field exists and query succeeded
                    discoveredSubfields.subfields.push(subfield);
                    discoveredSubfields.scalarFields.push(subfield);
                    console.log(`  ✓ ${subfield}`);
                } else {
                    const errorMsg = data.errors[0]?.message || '';
                    
                    // Check if field exists but has issues (like wrong args)
                    if (!errorMsg.toLowerCase().includes('cannot query field') &&
                        !errorMsg.toLowerCase().includes('unknown field')) {
                        discoveredSubfields.subfields.push(subfield);
                        console.log(`  ? ${subfield} (exists but needs attention)`);
                    }
                    
                    // Check for field suggestions
                    if (errorMsg.includes('Did you mean')) {
                        const match = errorMsg.match(/Did you mean ["\']?(\w+)["\']?/i);
                        if (match && !discoveredSubfields.subfields.includes(match[1])) {
                            console.log(`  💡 Suggestion: ${match[1]}`);
                        }
                    }
                }
                
                if (delay > 0) {
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
                
            } catch (e) {
                // Silent
            }
        }
        
        // Step 3: Try to get a sample with all discovered fields
        if (discoveredSubfields.scalarFields.length > 0) {
            console.log('\n📋 Building complete query with discovered fields...\n');
            
            const fieldsList = discoveredSubfields.scalarFields.slice(0, 10).join(' ');
            const completeQuery = { 
                query: `{ ${fieldName} { ${fieldsList} } }` 
            };
            
            try {
                const response = await fetch(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(completeQuery)
                });
                
                const data = await response.json();
                
                if (!data.errors && data.data) {
                    console.log('✅ Complete query works!');
                    console.log('\nSample query:');
                    console.log(`{\n  ${fieldName} {\n    ${fieldsList}\n  }\n}`);
                }
            } catch (e) {
                // Silent
            }
        }
        
        console.log('\n📊 Summary:');
        console.log(`Type: ${discoveredSubfields.typename || 'Unknown'}`);
        console.log(`Discovered fields: ${discoveredSubfields.subfields.length}`);
        if (discoveredSubfields.subfields.length > 0) {
            console.log('Fields:', discoveredSubfields.subfields.join(', '));
        }
        
        console.groupEnd();
        
        return discoveredSubfields;
    };
    
    /**
     * Enumerate GraphQL schema when introspection is disabled
     */
    window.enumerateGraphQLSchema = async function(endpoint = '/graphql', options = {}) {
        const {
            testMutations = true,
            testSubscriptions = false,
            customFields = [],
            delay = 100, // ms between requests
            probeSubfields = true
        } = options;
        
        console.group('🕵️  GraphQL Schema Enumeration (Introspection Disabled)');
        console.log('This may take a while...\n');
        
        const discovered = {
            queries: [],
            mutations: [],
            subscriptions: [],
            types: [],
            fieldSuggestions: new Set(),
            complexFields: [] // Fields that require subfields
        };
        
        // Common GraphQL query field names
        const commonQueryFields = [
            // User related
            'me', 'user', 'users', 'currentUser', 'viewer', 'profile', 'account',
            'getUserById', 'getUserByEmail', 'getUserByUsername',
            // Content
            'post', 'posts', 'article', 'articles', 'blog', 'blogs',
            'page', 'pages', 'content', 'contents',
            // Products/Commerce
            'product', 'products', 'item', 'items', 'cart', 'order', 'orders',
            'catalog', 'categories', 'category',
            // Data
            'data', 'list', 'search', 'find', 'get', 'fetch',
            'query', 'all', 'filter', 'results',
            // System
            'info', 'status', 'health', 'version', 'config', 'settings',
            'node', 'nodes', 'edge', 'edges',
            // Social
            'comment', 'comments', 'like', 'likes', 'follow', 'followers',
            'feed', 'timeline', 'notifications',
            ...customFields
        ];
        
        // Common mutation field names
        const commonMutations = [
            // User actions
            'login', 'logout', 'signup', 'register', 'authenticate',
            'createUser', 'updateUser', 'deleteUser',
            'updateProfile', 'changePassword', 'resetPassword',
            // CRUD operations
            'create', 'update', 'delete', 'remove', 'add',
            'createPost', 'updatePost', 'deletePost',
            'createProduct', 'updateProduct', 'deleteProduct',
            // Actions
            'submit', 'send', 'upload', 'download',
            'like', 'unlike', 'follow', 'unfollow',
            'comment', 'reply', 'share'
        ];
        
        console.log('🔍 Testing common query fields...\n');
        
        // Test each common field
        for (let i = 0; i < commonQueryFields.length; i++) {
            const field = commonQueryFields[i];
            
            try {
                const testQuery = { query: `{ ${field} }` };
                
                const response = await fetch(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(testQuery)
                });
                
                const data = await response.json();
                
                if (data.errors) {
                    const errorMsg = data.errors[0]?.message || '';
                    
                    // Field requires subfields (complex type)
                    if (errorMsg.includes('must have a selection of subfields') ||
                        errorMsg.includes('must have a sub selection')) {
                        discovered.queries.push(field);
                        discovered.complexFields.push({
                            name: field,
                            type: 'query',
                            requiresSubfields: true
                        });
                        console.log(`  ✓ Found query: ${field} (requires subfields - complex type)`);
                    }
                    // Field exists but might need arguments
                    else if (errorMsg.includes('argument') || 
                        errorMsg.includes('required') ||
                        errorMsg.includes('missing') ||
                        errorMsg.includes('must provide')) {
                        discovered.queries.push(field);
                        console.log(`  ✓ Found query: ${field} (requires arguments)`);
                    }
                    // Field doesn't exist, check for suggestions
                    else if (!errorMsg.toLowerCase().includes('cannot query field')) {
                        // Some other error - might be valid
                        if (errorMsg.length < 200) {
                            console.log(`  ? Possible: ${field} - ${errorMsg}`);
                        }
                    }
                    
                    // Extract field suggestions from error
                    const didYouMean = errorMsg.match(/Did you mean ["\']?(\w+)["\']?/i);
                    if (didYouMean) {
                        discovered.fieldSuggestions.add(didYouMean[1]);
                    }
                    
                    // Extract all quoted field names
                    const quotedFields = errorMsg.match(/["'](\w+)["']/g);
                    if (quotedFields && errorMsg.toLowerCase().includes('field')) {
                        quotedFields.forEach(f => {
                            const cleaned = f.replace(/["']/g, '');
                            if (cleaned !== field) {
                                discovered.fieldSuggestions.add(cleaned);
                            }
                        });
                    }
                    
                } else if (data.data) {
                    // Query succeeded!
                    discovered.queries.push(field);
                    console.log(`  ✓ Found valid query: ${field}`);
                }
                
            } catch (e) {
                // Silent fail
            }
            
            // Delay to avoid rate limiting
            if (delay > 0 && i % 10 === 0) {
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
        
        // Test mutations
        if (testMutations) {
            console.log('\n🔍 Testing common mutation fields...\n');
            
            for (let i = 0; i < commonMutations.length; i++) {
                const field = commonMutations[i];
                
                try {
                    const testQuery = { query: `mutation { ${field} }` };
                    
                    const response = await fetch(endpoint, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(testQuery)
                    });
                    
                    const data = await response.json();
                    
                    if (data.errors) {
                        const errorMsg = data.errors[0]?.message || '';
                        
                        // Mutation requires subfields
                        if (errorMsg.includes('must have a selection of subfields') ||
                            errorMsg.includes('must have a sub selection')) {
                            discovered.mutations.push(field);
                            discovered.complexFields.push({
                                name: field,
                                type: 'mutation',
                                requiresSubfields: true
                            });
                            console.log(`  ✓ Found mutation: ${field} (requires subfields - complex type)`);
                        }
                        // Mutation exists but needs arguments
                        else if (errorMsg.includes('argument') || 
                            errorMsg.includes('required') ||
                            errorMsg.includes('missing')) {
                            discovered.mutations.push(field);
                            console.log(`  ✓ Found mutation: ${field} (requires arguments)`);
                        }
                        
                        // Extract suggestions
                        const didYouMean = errorMsg.match(/Did you mean ["\']?(\w+)["\']?/i);
                        if (didYouMean) {
                            discovered.fieldSuggestions.add(didYouMean[1]);
                        }
                        
                    } else if (data.data) {
                        discovered.mutations.push(field);
                        console.log(`  ✓ Found valid mutation: ${field}`);
                    }
                    
                } catch (e) {
                    // Silent fail
                }
                
                if (delay > 0 && i % 10 === 0) {
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }
        
        // Test field suggestions we discovered
        if (discovered.fieldSuggestions.size > 0) {
            console.log('\n🔍 Testing discovered field suggestions...\n');
            
            for (const field of discovered.fieldSuggestions) {
                if (discovered.queries.includes(field)) continue;
                
                try {
                    const testQuery = { query: `{ ${field} }` };
                    const response = await fetch(endpoint, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(testQuery)
                    });
                    
                    const data = await response.json();
                    
                    if (data.errors) {
                        const errorMsg = data.errors[0]?.message || '';
                        if (errorMsg.includes('argument') || !errorMsg.toLowerCase().includes('cannot query')) {
                            discovered.queries.push(field);
                            console.log(`  ✓ Confirmed query: ${field}`);
                        }
                    } else if (data.data) {
                        discovered.queries.push(field);
                        console.log(`  ✓ Confirmed valid query: ${field}`);
                    }
                } catch (e) {
                    // Silent
                }
            }
        }
        
        // Automatically probe complex fields
        if (probeSubfields && discovered.complexFields.length > 0) {
            console.log(`\n🔍 Auto-probing ${discovered.complexFields.length} complex field(s) for subfields...\n`);
            
            for (const complexField of discovered.complexFields) {
                console.log(`\n${'='.repeat(50)}`);
                await probeGraphQLSubfields(endpoint, complexField.name, { delay: delay });
                
                // Small delay between probes
                if (delay > 0) {
                    await new Promise(resolve => setTimeout(resolve, delay * 2));
                }
            }
        }
        
        // Summary
        console.log('\n═══════════════════════════════════════════');
        console.log('📊 ENUMERATION RESULTS');
        console.log('═══════════════════════════════════════════\n');
        
        if (discovered.queries.length > 0) {
            console.log(`🔍 Discovered Queries (${discovered.queries.length}):`);
            discovered.queries.forEach(q => {
                const isComplex = discovered.complexFields.find(f => f.name === q && f.type === 'query');
                const marker = isComplex ? ' 🔸 (complex type)' : '';
                console.log(`  • ${q}${marker}`);
            });
            console.log('');
        } else {
            console.log('🔍 No queries discovered\n');
        }
        
        if (discovered.mutations.length > 0) {
            console.log(`✏️  Discovered Mutations (${discovered.mutations.length}):`);
            discovered.mutations.forEach(m => {
                const isComplex = discovered.complexFields.find(f => f.name === m && f.type === 'mutation');
                const marker = isComplex ? ' 🔸 (complex type)' : '';
                console.log(`  • ${m}${marker}`);
            });
            console.log('');
        }
        
        if (discovered.complexFields.length > 0) {
            console.log(`🔸 Complex Fields (${discovered.complexFields.length}) - require subfields:`);
            discovered.complexFields.forEach(f => console.log(`  • ${f.name} (${f.type})`));
            console.log('');
        }
        
        if (discovered.fieldSuggestions.size > 0) {
            console.log(`💡 Field Suggestions from Errors (${discovered.fieldSuggestions.size}):`);
            Array.from(discovered.fieldSuggestions).forEach(f => console.log(`  • ${f}`));
            console.log('');
        }
        
        console.log('💡 NEXT STEPS:');
        if (discovered.complexFields.length > 0 && probeSubfields) {
            console.log('   • Check above for auto-probed subfields of complex types');
        }
        console.log('   • Test each discovered field with proper arguments');
        console.log("     (Example: { fieldName(arg1: \"value\") { id name } })");
        console.log('   • Use probeGraphQLSubfields(endpoint, fieldName) to manually probe any field');
        console.log('   • Analyze error messages for parameter hints');
        console.log('   • Check application code/network tab for actual queries');
        
        console.groupEnd();
        
        return {
            queries: discovered.queries,
            mutations: discovered.mutations,
            subscriptions: discovered.subscriptions,
            complexFields: discovered.complexFields,
            suggestions: Array.from(discovered.fieldSuggestions)
        };
    };
    
    /**
     * Extract all URL patterns from page
     */
    window.extractAllURLs = function() {
        console.group('🔗 All URL Extraction');
        
        const urls = new Set();
        const pageSource = document.documentElement.innerHTML;
        
        // Extract all HTTP/HTTPS URLs
        const urlRegex = /https?:\/\/[^\s"'<>)}\]]+/gi;
        const matches = pageSource.match(urlRegex);
        
        if (matches) {
            matches.forEach(url => {
                // Clean up trailing punctuation
                url = url.replace(/[,;.!)}\]]+$/, '');
                urls.add(url);
            });
        }
        
        // Get all links
        document.querySelectorAll('a[href]').forEach(a => {
            const href = a.getAttribute('href');
            if (href && !href.startsWith('#') && !href.startsWith('javascript:')) {
                urls.add(href);
            }
        });
        
        // Get all images, scripts, stylesheets
        document.querySelectorAll('img[src], script[src], link[href]').forEach(el => {
            const src = el.getAttribute('src') || el.getAttribute('href');
            if (src) urls.add(src);
        });
        
        console.log(`Found ${urls.size} unique URL(s):\n`);
        
        // Categorize URLs
        const categorized = {
            internal: [],
            external: [],
            api: [],
            relative: []
        };
        
        urls.forEach(url => {
            if (url.startsWith('http')) {
                const urlObj = new URL(url);
                if (urlObj.hostname === window.location.hostname) {
                    categorized.internal.push(url);
                } else {
                    categorized.external.push(url);
                }
                
                if (url.includes('/api/') || url.includes('/graphql')) {
                    categorized.api.push(url);
                }
            } else {
                categorized.relative.push(url);
            }
        });
        
        console.log(`📍 Internal URLs: ${categorized.internal.length}`);
        categorized.internal.slice(0, 10).forEach(url => console.log('  -', url));
        if (categorized.internal.length > 10) console.log(`  ... and ${categorized.internal.length - 10} more`);
        
        console.log(`\n🌐 External URLs: ${categorized.external.length}`);
        categorized.external.slice(0, 10).forEach(url => console.log('  -', url));
        if (categorized.external.length > 10) console.log(`  ... and ${categorized.external.length - 10} more`);
        
        console.log(`\n🔌 API URLs: ${categorized.api.length}`);
        categorized.api.forEach(url => console.log('  -', url));
        
        console.log(`\n📁 Relative URLs: ${categorized.relative.length}`);
        categorized.relative.slice(0, 10).forEach(url => console.log('  -', url));
        if (categorized.relative.length > 10) console.log(`  ... and ${categorized.relative.length - 10} more`);
        
        console.groupEnd();
        
        return categorized;
    };
    
    console.log('✅ Reconnaissance Inspector loaded!');
    console.log('\n📋 AVAILABLE COMMANDS:\n');
    console.log('🔍 Discovery:');
    console.log('  • findEventListeners()                                 - Find all event listeners');
    console.log('  • findHiddenFields()                                   - Find hidden fields');
    console.log('  • findDataAttributes()                                 - Find data attributes');
    console.log('  • findAPIEndpoints()                                   - Discover ALL URLs & endpoints');
    console.log('  • findAPIEndpoints({ includeExternalResources: true }) - Include static resources');
    console.log('  • findAllHrefLinks()                                   - Discover all href links');
    console.log('  • extractAllURLs()                                     - Extract and categorize all URLs');
    console.log('\n🔐 GraphQL Testing:');
    console.log('  • testGraphQLIntrospection(endpoint)                   - Test GraphQL introspection (comprehensive)');
    console.log('  • testGraphQLIntrospection("/graphql", { tryAlternatives: false }) - Quick test only');
    console.log('  • enumerateGraphQLSchema(endpoint)                     - Enumerate schema when introspection blocked');
    console.log('  • enumerateGraphQLSchema("/graphql", { probeSubfields: true }) - Auto-probe complex fields');
    console.log('  • probeGraphQLSubfields(endpoint, "fieldName")         - Discover subfields of a complex type');
    console.log('  • probeGraphQLSubfields("/graphql", "getFunctions")    - Example: probe getFunctions field');
})();
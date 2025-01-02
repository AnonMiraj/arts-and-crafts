// ==UserScript==
// @name         Redirect to Vjudge for SPOJ and UVa (All Subdomains)
// @namespace    http://tampermonkey.net/
// @version      1.0
// @author       Anonmiraj
// @match        *://*.spoj.com/problems/*
// @match        *://*.onlinejudge.org/*
// ==/UserScript==

(function() {
    'use strict';

    if (window.location.host.endsWith("spoj.com")) {
        const pathParts = window.location.pathname.split('/');
        if (pathParts.length > 2) {
            const problemCode = pathParts[2];
            const vjudgeUrl = `https://vjudge.net/problem/SPOJ-${problemCode}`;

            const shouldRedirect = confirm(`Do you want to redirect to Vjudge for problem SPOJ-${problemCode}?`);

            if (shouldRedirect) {
                window.location.replace(vjudgeUrl);
            }
        }
    }

    if (window.location.host.endsWith("onlinejudge.org")) {
        window.addEventListener('load', () => {
            const problemHeading = document.querySelector('#col3_content h3');
            if (problemHeading) {
                const problemText = problemHeading.textContent.trim();
                const problemMatch = problemText.match(/^(\d+)\s+-/);

                if (problemMatch) {
                    const problemID = problemMatch[1];
                    const vjudgeUrl = `https://vjudge.net/problem/UVA-${problemID}`;

                    const shouldRedirect = confirm(`Do you want to redirect to Vjudge for problem UVA-${problemID}?`);

                    if (shouldRedirect) {
                        window.location.replace(vjudgeUrl);
                    }
                }
            }
        });
    }
})();

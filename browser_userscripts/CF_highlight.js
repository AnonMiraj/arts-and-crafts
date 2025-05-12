// ==UserScript==
// @name         CF Problem Status Highlighter
// @namespace    https://codeforces.com/
// @version      1.2
// @description  Highlight problems based on your most recent verdict (OK=green, WA=red, TLE=yellow)
// @match        https://codeforces.com/problemset/status?friends=on*
// @match        https://codeforces.com/problemset/status/page/*friends=true*
// @grant        none
// ==/UserScript==

(async function() {
    'use strict';

    const HANDLE = document.querySelector('a[href^="/profile/"]')?.textContent.trim();
    const CACHE_KEY = `cf_status_cache_${HANDLE}`;
    const ONE_DAY = 24 * 60 * 60 * 1000;

    async function loadSubmissions() {
        let cache = localStorage.getItem(CACHE_KEY);
        if (cache) {
            try {
                cache = JSON.parse(cache);
                if (Date.now() - cache.timestamp < ONE_DAY && Array.isArray(cache.submissions)) {
                    console.log('Using cached submissions');
                    return cache.submissions;
                }
            } catch (e) {
                console.log('Cache invalid, will fetch fresh');
            }
        }

        console.log('Fetching fresh submissions from API');
        try {
            const response = await fetch(`https://codeforces.com/api/user.status?handle=${HANDLE}`);
            const data = await response.json();

            if (data.status !== 'OK') {
                throw new Error(`API error: ${data.comment || 'Unknown error'}`);
            }

            const submissions = data.result;
            localStorage.setItem(CACHE_KEY, JSON.stringify({
                timestamp: Date.now(),
                submissions: submissions
            }));

            return submissions;
        } catch (error) {
            console.error('Error fetching submissions:', error);
            return [];
        }
    }

    function buildVerdictMap(submissions) {
        const map = new Map();

        const sortedSubmissions = submissions.sort((a, b) => b.creationTimeSeconds - a.creationTimeSeconds);

        for (const submission of sortedSubmissions) {
            if (!submission.problem) continue;

            const contestId = submission.problem.contestId || 'unknown';
            const index = submission.problem.index;
            const key = `${contestId}-${index}`;

            if (!map.has(key)) {
                map.set(key, submission);
            }
        }

        return map;
    }

    function getColorForVerdict(verdict) {
        switch (verdict) {
            case 'OK':
                return 'rgba(40, 194, 69, 0.3)'; // Green for accepted
            case 'WRONG_ANSWER':
                return 'rgba(220, 53, 69, 0.3)'; // Red for wrong answer
            case 'TIME_LIMIT_EXCEEDED':
                return 'rgba(255, 193, 7, 0.3)'; // Yellow for TLE
            case 'MEMORY_LIMIT_EXCEEDED':
                return 'rgba(255, 149, 7, 0.3)'; // Orange for MLE
            case 'RUNTIME_ERROR':
                return 'rgba(138, 43, 226, 0.3)'; // Purple for RE
            default:
                return 'rgba(108, 117, 125, 0.3)'; 
        }
    }

    function extractProblemInfo(row) {
        const problemCell = row.querySelector('td[data-problemid]');
        if (problemCell) {
            const problemLink = problemCell.querySelector('a');
            if (problemLink) {
                const href = problemLink.getAttribute('href');
                const match = href.match(/\/problemset\/problem\/(\d+)\/([A-Z]\d*)/);
                if (match) {
                    return {
                        contestId: match[1],
                        index: match[2]
                    };
                }
            }
        }
        return null;
    }


    function removeDarkClasses(row) {
        row.classList.remove('dark');

        const darkElements = row.querySelectorAll('.dark');
        darkElements.forEach(element => {
            element.classList.remove('dark');
        });
    }

    async function highlightProblems() {
        try {
            const submissions = await loadSubmissions();
            const verdictMap = buildVerdictMap(submissions);

            console.log(`Loaded ${submissions.length} submissions, processing ${verdictMap.size} unique problems`);

            const allRows = document.querySelectorAll('table tr, .datatable tr');
            let processedRows = 0;
            let highlightedCount = 0;
            let notFoundCount = 0;

            allRows.forEach(row => {
                if (!row.hasAttribute('data-submission-id')) return;

                processedRows++;

                const problemInfo = extractProblemInfo(row);
                if (!problemInfo) {
                    console.debug('Could not extract problem info from row:', row);
                    return;
                }

                const key = `${problemInfo.contestId}-${problemInfo.index}`;
                const submission = verdictMap.get(key);

                if (submission) {
                    const color = getColorForVerdict(submission.verdict);
                    row.style.backgroundColor = color;
                    row.title = `Most recent: ${submission.verdict} (${new Date(submission.creationTimeSeconds * 1000).toLocaleString()})`;
                    highlightedCount++;
                }
              else {
                    // row.style.backgroundColor = 'rgba(108, 117, 125, 0.3)'; // gray
                    notFoundCount++;
                }

                removeDarkClasses(row);
            });

            console.log(`Processed ${processedRows} rows: ${highlightedCount} highlighted, ${notFoundCount} not found`);
        } catch (error) {
            console.error('Error in highlightProblems:', error);
        }
    }

    function waitForPageLoad() {
        return new Promise((resolve) => {
            if (document.readyState === 'complete') {
                resolve();
            } else {
                window.addEventListener('load', resolve);
            }
        });
    }

    function setupObserver() {
        const observer = new MutationObserver((mutations) => {
            let shouldUpdate = false;
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    for (const node of mutation.addedNodes) {
                        if (node.nodeType === Node.ELEMENT_NODE &&
                            (node.tagName === 'TR' || node.querySelector('tr'))) {
                            shouldUpdate = true;
                            break;
                        }
                    }
                }
            });

            if (shouldUpdate) {
                clearTimeout(observer.debounceTimer);
                observer.debounceTimer = setTimeout(highlightProblems, 500);
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        return observer;
    }

    (async () => {
        await waitForPageLoad();
        await highlightProblems();

        const observer = setupObserver();

        window.addEventListener('popstate', () => {
            setTimeout(highlightProblems, 100);
        });

        window.addEventListener('hashchange', () => {
            setTimeout(highlightProblems, 100);
        });
    })();
})();

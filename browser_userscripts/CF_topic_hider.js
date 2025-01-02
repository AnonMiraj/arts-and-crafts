// ==UserScript==
// @name         Codeforces Keyword Hider
// @namespace    http://tampermonkey.net/
// @version      1.0
// @match        *://*.codeforces.com/group/o09Gu2FpOx/*
// @grant        none
// @require      https://code.jquery.com/jquery-3.6.0.min.js
// ==/UserScript==

(function() {
    'use strict';

    const keywords = [
        "string (hard)",
        "string (medium)",
        "string (easy)",
        "combinatorics and probability (hard)",
        "combinatorics and probability (medium)",
        "combinatorics and probability (easy)",
        "number theory (hard)",
        "number theory (medium)",
        "number theory (easy)",
        "graph(hard)",
        "graph(medium)",
        "graph(easy)",
        "geometry(hard)",
        "geometry(medium)",
        "geometry(easy)",
        "ad-hoc(hard)",
        "ad-hoc(medium)",
        "ad-hoc(easy)",
        "data-structure (hard)",
        "data-structure (medium)",
        "data-structure (easy)",
        "dp (hard)",
        "dp (medium)",
        "dp (easy)"
    ];

    const style = document.createElement('style');
    style.textContent = `
        .keyword-hidden {
            color: transparent !important;
            transition: color 0.2s;
        }

        .keyword-hidden:hover {
            color: inherit !important;
        }
    `;
    document.head.appendChild(style);

    function handleToggleClick(button) {
        const $button = $(button);
        const $target = $button.parent().next();
        const dataPageUrl = $target.attr("data-page-url");

        if (!button.dataset.processed) {
            $button.toggleClass("la-angle-down la-angle-right");

            $target.toggle();

            const collapsed = $button.hasClass("la-angle-right");
            const params = {
                action: "setCollapsed",
                sidebarFrameSimpleClassName: "GroupContestsSidebarFrame",
                collapsed
            };

            $.each($target[0].attributes, function(i, a) {
                const name = a.name;
                if (name.startsWith("data-extra-key-")) {
                    const key = a.value;
                    const keyIndex = parseInt(name.substring("data-extra-key-".length));
                    const value = $target.attr("data-extra-value-" + keyIndex);
                    params[key] = value;
                }
            });

            if (dataPageUrl) {
                $.post(dataPageUrl, params, function(result) {
                    if (result["success"] !== "true") {
                        console.log("Failed to save collapsed state.");
                    }
                }, "json");
            }

            button.dataset.processed = 'true';
        }
    }

    function handleToggleButtons() {
        const toggleButtons = document.querySelectorAll('i.sidebar-caption-icon.las.la-angle-down');
        toggleButtons.forEach(button => {
            handleToggleClick(button);
        });
    }

    function processNode(node) {
        if (node.nodeType === Node.TEXT_NODE) {
            const parent = node.parentNode;
            const text = node.textContent;

            for (const keyword of keywords) {
                if (text.includes(keyword)) {
                    const parts = text.split(keyword);
                    const span = document.createElement('span');
                    span.className = 'keyword-hidden';
                    span.textContent = keyword;

                    if (parts[0]) {
                        parent.insertBefore(document.createTextNode(parts[0]), node);
                    }
                    parent.insertBefore(span, node);
                    if (parts[1]) {
                        parent.insertBefore(document.createTextNode(parts[1]), node);
                    }
                    parent.removeChild(node);
                    return;
                }
            }
        }
    }

    function processAllNodes(root) {
        const walker = document.createTreeWalker(
            root,
            NodeFilter.SHOW_TEXT,
            null,
            false
        );

        const nodes = [];
        let node;
        while (node = walker.nextNode()) {
            nodes.push(node);
        }

        nodes.forEach(processNode);
    }

    function initialize() {
        if (typeof $ === 'undefined') {
            setTimeout(initialize, 100);
            return;
        }

        processAllNodes(document.body);
        handleToggleButtons();

        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        processAllNodes(node);
                        handleToggleButtons();
                    }
                });
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    initialize();
})();

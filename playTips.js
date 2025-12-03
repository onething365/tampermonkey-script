// ==UserScript==
// @name         顶部右向左单次/无限滚动（支持自定义位置与宽度）
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  当内容未超过区域宽度时单次滚动；超过时无限滚动；支持悬停暂停、移出继续、窗口变化重算；可自定义 top/left/width。
// @author       onething365
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    /*********************************
     * ⬇⬇⬇ 新增：可自定义位置与宽度 ⬇⬇⬇
     *********************************/
    const BAR_TOP = '4px';     // 例如：20px
    const BAR_LEFT = '210px';    // 例如：50px
    const BAR_WIDTH = 'calc(100% - 340px)';  // 例如：600px（也可填 window.innerWidth）
    const BAR_HEIGHT = '40px';  // 高度依旧可配置

    const names = ['张三','李四','王五',];

    // 滚动条容器
    const bar = document.createElement('div');
    bar.id = 'scroll-bar';
    bar.style.cssText = `
        position: fixed;
        top: ${BAR_TOP};
        left: ${BAR_LEFT};
        width: ${BAR_WIDTH};
        height: ${BAR_HEIGHT};
        background: linear-gradient(135deg,#667eea,#764ba2);
        color:#fff; display:flex; align-items:center;
        overflow:hidden; z-index:999999; font-size:16px;
        box-shadow:0 2px 8px rgba(0,0,0,0.25);
        border-radius: 6px;
    `;

    const container = document.createElement('div');
    container.style.cssText = `
        position: absolute;
        white-space: nowrap;
        will-change: transform;
        display: inline-flex;
    `;

    function buildInnerHTML() {
        return names.map(n => `
            <span style="
                padding: 6px 15px;
                margin: 0 20px;
                background: rgba(255,255,255,0.25);
                border-radius: 20px;
                font-weight: bold;
            ">${n}</span>
        `).join('');
    }

    container.innerHTML = buildInnerHTML();
    bar.appendChild(container);
    document.body.appendChild(bar);

    /*********************************
     * 原有逻辑保持不变（仅移除 body marginTop 逻辑）
     *********************************/

    let running = false;
    let paused = false;
    let singleMode = true;
    let lastX = 0;
    let endX = 0;

    const speed = 100; // px 每秒

    const startSingleScroll = () => {
        const barWidth = bar.clientWidth;
        const contentWidth = container.scrollWidth;

        lastX = barWidth;
        endX = -contentWidth;

        container.style.transition = 'none';
        container.style.transform = `translateX(${lastX}px)`;

        const distance = barWidth + contentWidth;
        const duration = distance / speed;

        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                container.style.transition = `transform ${duration}s linear`;
                container.style.transform = `translateX(${endX}px)`;
                running = true;
            });
        });
    };

    container.addEventListener('transitionend', () => {
        if (!singleMode) return;
        if (paused) return;
        running = false;
        startSingleScroll();
    });

    const ensureDoubleContent = () => {
        if (container.children.length === names.length) {
            container.innerHTML = buildInnerHTML() + buildInnerHTML();
        }
    };

    const startInfiniteScroll = () => {
        ensureDoubleContent();

        container.style.transition = 'none';
        container.style.transform = `translateX(0px)`;

        const contentWidth = container.scrollWidth / 2;
        const duration = contentWidth / speed;

        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                container.style.transition = `transform ${duration}s linear`;
                container.style.transform = `translateX(-${contentWidth}px)`;
                running = true;
            });
        });
    };

    container.addEventListener('transitionend', () => {
        if (!singleMode) {
            if (paused) return;
            startInfiniteScroll();
        }
    });

    // 悬停暂停
    bar.addEventListener('mouseenter', () => {
        if (!running) return;
        paused = true;
        const matrix = new DOMMatrixReadOnly(getComputedStyle(container).transform);
        lastX = matrix.m41;

        container.style.transition = 'none';
        container.style.transform = `translateX(${lastX}px)`;
    });

    // 移出继续
    bar.addEventListener('mouseleave', () => {
        if (!paused) return;
        paused = false;

        const matrix = new DOMMatrixReadOnly(getComputedStyle(container).transform);
        lastX = matrix.m41;

        const contentWidth = container.scrollWidth / (singleMode ? 1 : 2);

        if (singleMode) {
            const remaining = lastX - endX;
            const duration = remaining / speed;

            container.style.transition = `transform ${duration}s linear`;
            container.style.transform = `translateX(${endX}px)`;
        } else {
            const remaining = lastX + contentWidth;
            const duration = remaining / speed;

            container.style.transition = `transform ${duration}s linear`;
            container.style.transform = `translateX(-${contentWidth}px)`;
        }
    });

    const reloadScroll = () => {
        paused = false;
        running = false;

        container.style.transition = 'none';
        container.style.transform = 'translateX(0)';

        container.innerHTML = buildInnerHTML();

        const barWidth = bar.clientWidth;
        const contentWidth = container.scrollWidth;

        singleMode = contentWidth <= barWidth;

        if (!singleMode) ensureDoubleContent();

        setTimeout(() => {
            singleMode ? startSingleScroll() : startInfiniteScroll();
        }, 50);
    };

    const init = () => {
        reloadScroll();
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else init();

    window.addEventListener('resize', () => {
        reloadScroll();
    });

})();
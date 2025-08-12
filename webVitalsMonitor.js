// ==UserScript==
// @name         Web Vitals Monitor
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  在页面上显示Web Vitals性能指标
// @author       onething365
// @match        *://*/*
// @grant        GM_addStyle
// @require      https://unpkg.com/web-vitals@3/dist/web-vitals.iife.js
// ==/UserScript==

(function() {
    'use strict';

    // 添加自定义样式
    GM_addStyle(`
        #web-vitals-panel {
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 9999;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 15px;
            border-radius: 8px;
            font-family: Arial, sans-serif;
            font-size: 14px;
            min-width: 250px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        #web-vitals-panel h3 {
            margin: 0 0 10px 0;
            padding: 0;
            color: #4CAF50;
            font-size: 16px;
        }
        .vital-metric {
            margin-bottom: 8px;
            display: flex;
            justify-content: space-between;
        }
        .metric-name {
            font-weight: bold;
        }
        .metric-value {
            color: #FFC107;
        }
        .metric-good {
            color: #4CAF50;
        }
        .metric-needs-improvement {
            color: #FF9800;
        }
        .metric-poor {
            color: #F44336;
        }
        .close-btn {
            position: absolute;
            top: 5px;
            right: 5px;
            cursor: pointer;
            color: #ccc;
            font-size: 12px;
        }
        .close-btn:hover {
            color: white;
        }
    `);

    // 创建面板
    const panel = document.createElement('div');
    panel.id = 'web-vitals-panel';
    panel.innerHTML = `
        <span class="close-btn" title="关闭面板">×</span>
        <h3>Web Vitals 指标</h3>
        <div class="vital-metric">
            <span class="metric-name">LCP:</span>
            <span class="metric-value" id="lcp-value">测量中...</span>
        </div>
        <div class="vital-metric">
            <span class="metric-name">FID:</span>
            <span class="metric-value" id="fid-value">测量中...</span>
        </div>
        <div class="vital-metric">
            <span class="metric-name">CLS:</span>
            <span class="metric-value" id="cls-value">测量中...</span>
        </div>
        <div class="vital-metric">
            <span class="metric-name">INP:</span>
            <span class="metric-value" id="inp-value">测量中...</span>
        </div>
        <div class="vital-metric">
            <span class="metric-name">FCP:</span>
            <span class="metric-value" id="fcp-value">测量中...</span>
        </div>
        <div class="vital-metric">
            <span class="metric-name">TTFB:</span>
            <span class="metric-value" id="ttfb-value">测量中...</span>
        </div>
    `;

    // 添加到页面
    document.body.appendChild(panel);

    // 关闭按钮功能
    panel.querySelector('.close-btn').addEventListener('click', () => {
        panel.style.display = 'none';
    });

    // 根据指标值设置样式
    function setMetricClass(element, value, thresholds) {
        element.classList.remove('metric-good', 'metric-needs-improvement', 'metric-poor');
        
        if (value <= thresholds.good) {
            element.classList.add('metric-good');
        } else if (value <= thresholds.needsImprovement) {
            element.classList.add('metric-needs-improvement');
        } else {
            element.classList.add('metric-poor');
        }
    }

    // 更新面板显示
    function updateMetric(metricName, value) {
        const element = document.getElementById(`${metricName.toLowerCase()}-value`);
        if (!element) return;

        let displayValue = value;
        let thresholds = { good: 0, needsImprovement: 0 };

        switch (metricName) {
            case 'LCP':
                displayValue = `${value.toFixed(2)} ms`;
                thresholds = { good: 2500, needsImprovement: 4000 };
                break;
            case 'FID':
                displayValue = `${value.toFixed(2)} ms`;
                thresholds = { good: 100, needsImprovement: 300 };
                break;
            case 'CLS':
                displayValue = value.toFixed(4);
                thresholds = { good: 0.1, needsImprovement: 0.25 };
                break;
            case 'INP':
                displayValue = `${value.toFixed(2)} ms`;
                thresholds = { good: 200, needsImprovement: 500 };
                break;
            case 'FCP':
                displayValue = `${value.toFixed(2)} ms`;
                thresholds = { good: 1800, needsImprovement: 3000 };
                break;
            case 'TTFB':
                displayValue = `${value.toFixed(2)} ms`;
                thresholds = { good: 800, needsImprovement: 1800 };
                break;
        }

        element.textContent = displayValue;
        setMetricClass(element, value, thresholds);
    }

    // 测量各项指标
    function measureWebVitals() {
        // LCP - 最大内容绘制
        webVitals.getLCP((metric) => {
            updateMetric('LCP', metric.value);
        });

        // FID - 首次输入延迟
        webVitals.getFID((metric) => {
            updateMetric('FID', metric.value);
        });

        // CLS - 累积布局偏移
        webVitals.getCLS((metric) => {
            updateMetric('CLS', metric.value);
        }, true); // 持续监控CLS变化

        // INP - 交互到下一次绘制
        webVitals.getINP((metric) => {
            updateMetric('INP', metric.value);
        }, { duration: 5000 }); // 5秒内统计交互

        // FCP - 首次内容绘制
        webVitals.getFCP((metric) => {
            updateMetric('FCP', metric.value);
        });

        // TTFB - 首字节时间
        webVitals.getTTFB((metric) => {
            updateMetric('TTFB', metric.value);
        });
    }

    // 页面加载完成后开始测量
    if (document.readyState === 'complete') {
        measureWebVitals();
    } else {
        window.addEventListener('load', measureWebVitals);
    }

    // 添加拖拽功能
    let isDragging = false;
    let offsetX, offsetY;

    panel.addEventListener('mousedown', (e) => {
        if (e.target === panel || e.target.tagName === 'H3') {
            isDragging = true;
            offsetX = e.clientX - panel.getBoundingClientRect().left;
            offsetY = e.clientY - panel.getBoundingClientRect().top;
            panel.style.cursor = 'grabbing';
        }
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        
        panel.style.left = `${e.clientX - offsetX}px`;
        panel.style.top = `${e.clientY - offsetY}px`;
    });

    document.addEventListener('mouseup', () => {
        isDragging = false;
        panel.style.cursor = '';
    });
})();
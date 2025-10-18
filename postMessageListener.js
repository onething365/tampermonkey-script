// ==UserScript==
// @name         postMessage 监听器
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  实时监听和显示页面中的 postMessage 通信
// @author       onething365
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // 创建显示面板
    function createMessagePanel() {
        const panel = document.createElement('div');
        panel.id = 'postMessageMonitor';
        panel.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            width: 400px;
            height: 500px;
            background: rgba(0, 0, 0, 0.9);
            color: #00ff00;
            border: 2px solid #00ff00;
            border-radius: 8px;
            font-family: 'Courier New', monospace;
            font-size: 12px;
            z-index: 10000;
            overflow: hidden;
            display: flex;
            flex-direction: column;
        `;

        // 标题栏
        const header = document.createElement('div');
        header.style.cssText = `
            background: #006600;
            padding: 8px;
            font-weight: bold;
            display: flex;
            justify-content: space-between;
            align-items: center;
            cursor: move;
        `;
        header.innerHTML = `
            <span>postMessage 监听器 <span id="messageCounter">消息数量: 0</span></span>
            <div>
                <button id="clearMessages" style="margin-right: 5px; background: #ff4444; color: white; border: none; padding: 2px 8px; border-radius: 3px; cursor: pointer;">清空</button>
                <button id="togglePanel" style="background: #4444ff; color: white; border: none; padding: 2px 8px; border-radius: 3px; cursor: pointer;">最小化</button>
            </div>
        `;

        // 消息容器
        const messageContainer = document.createElement('div');
        messageContainer.id = 'messageContainer';
        messageContainer.style.cssText = `
            flex: 1;
            overflow-y: auto;
            padding: 5px;
        `;

        panel.appendChild(header);
        panel.appendChild(messageContainer);

        document.body.appendChild(panel);

        // 添加拖拽功能
        let isDragging = false;
        let dragOffset = { x: 0, y: 0 };

        header.addEventListener('mousedown', (e) => {
            if (e.target.tagName === 'BUTTON') return;
            isDragging = true;
            dragOffset.x = e.clientX - panel.offsetLeft;
            dragOffset.y = e.clientY - panel.offsetTop;
            panel.style.cursor = 'grabbing';
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            panel.style.left = (e.clientX - dragOffset.x) + 'px';
            panel.style.top = (e.clientY - dragOffset.y) + 'px';
            panel.style.right = 'auto';
        });

        document.addEventListener('mouseup', () => {
            isDragging = false;
            panel.style.cursor = 'default';
        });

        // 清空消息按钮
        document.getElementById('clearMessages').addEventListener('click', () => {
            messageContainer.innerHTML = '';
            messageCount = 0;
            updateCounter();
        });

        // 最小化按钮
        document.getElementById('togglePanel').addEventListener('click', () => {
            const container = document.getElementById('messageContainer');
            const counter = document.getElementById('messageCounter');
            const button = document.getElementById('togglePanel');
            
            if (container.style.display !== 'none') {
                container.style.display = 'none';
                counter.style.display = 'none';
                button.textContent = '最大化';
                panel.style.height = 'auto';
            } else {
                container.style.display = 'block';
                counter.style.display = 'block';
                button.textContent = '最小化';
                panel.style.height = '500px';
            }
        });

        return { panel, messageContainer  };
    }

    // 消息计数
    let messageCount = 0;

    // 更新计数器
    function updateCounter() {
        const counter = document.getElementById('messageCounter');
        if (counter) {
            counter.textContent = `消息数量: ${messageCount}`;
        }
    }

    // 添加消息到面板
    function addMessageToPanel(data) {
        const messageContainer = document.getElementById('messageContainer');
        if (!messageContainer) return;

        const messageElement = document.createElement('div');
        messageElement.style.cssText = `
            border-bottom: 1px solid #333;
            padding: 8px 5px;
            word-break: break-all;
        `;

        const timestamp = new Date().toLocaleTimeString();
        
        let content = data.message;
        if (typeof content === 'object') {
            try {
                content = JSON.stringify(content, null, 2);
            } catch (e) {
                content = String(content);
            }
        }

        messageElement.innerHTML = `
            <div style="color: #ffff00; font-size: 10px; margin-bottom: 3px;">
                [${timestamp}] 来源: ${data.origin}
            </div>
            <div style="color: #ffffff; font-size: 11px;">
                ${escapeHtml(content)}
            </div>
            <div style="color: #8888ff; font-size: 10px; margin-top: 3px;">
                目标: ${data.targetOrigin || '*'}
            </div>
        `;

        messageContainer.appendChild(messageElement);
        messageContainer.scrollTop = messageContainer.scrollHeight;

        messageCount++;
        updateCounter();
    }

    // HTML 转义函数
    function escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;")
            .replace(/\n/g, "<br>")
            .replace(/ /g, "&nbsp;");
    }

    // 监听 postMessage
    const originalPostMessage = window.postMessage;
    window.postMessage = function(message, targetOrigin, transfer) {
        // 记录消息
        addMessageToPanel({
            message: message,
            origin: window.location.origin,
            targetOrigin: targetOrigin || '*'
        });

        // 调用原始方法
        return originalPostMessage.call(this, message, targetOrigin, transfer);
    };

    // 监听接收到的消息
    window.addEventListener('message', (event) => {
        // 忽略来自同一窗口的消息（避免重复记录）
        if (event.source === window) return;

        addMessageToPanel({
            message: event.data,
            origin: event.origin,
            targetOrigin: event.source === window ? 'self' : 'external'
        });
    }, true);

    // 等待页面加载完成后创建面板
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            createMessagePanel();
        });
    } else {
        createMessagePanel();
    }

    // 添加样式
    const style = document.createElement('style');
    style.textContent = `
        #messageContainer::-webkit-scrollbar {
            width: 8px;
        }
        #messageContainer::-webkit-scrollbar-track {
            background: #001100;
        }
        #messageContainer::-webkit-scrollbar-thumb {
            background: #00ff00;
            border-radius: 4px;
        }
        #messageContainer::-webkit-scrollbar-thumb:hover {
            background: #00cc00;
        }
    `;
    document.head.appendChild(style);

    console.log('postMessage 监听器已启动');
})();
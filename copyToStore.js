// ==UserScript==
// @name         网页选中文本转待办事项
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  将网页选中的文本通过右键菜单添加到待办事项，存储到localStorage
// @author       onething365
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // 初始化待办事项数组
    let todos = JSON.parse(localStorage.getItem('webTodos') || '[]');

    // 生成唯一ID
    function generateId() {
        return Date.now() + Math.floor(Math.random() * 1000);
    }

    // 保存到localStorage
    function saveTodos() {
        localStorage.setItem('webTodos', JSON.stringify(todos));
    }

    // 创建右键菜单项
    const menuItem = document.createElement('div');
    menuItem.innerHTML = '添加到待办事项';
    menuItem.style.cssText = `
        position: fixed;
        background: #fff;
        border: 1px solid #ccc;
        border-radius: 4px;
        padding: 8px 12px;
        font-size: 14px;
        cursor: pointer;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        z-index: 10000;
        display: none;
        color: #333;
        font-family: Arial, sans-serif;
    `;

    document.body.appendChild(menuItem);

    // 隐藏菜单
    function hideMenu() {
        menuItem.style.display = 'none';
    }

    // 显示菜单
    function showMenu(x, y) {
        menuItem.style.left = x + 'px';
        menuItem.style.top = y + 'px';
        menuItem.style.display = 'block';
    }

    // 添加待办事项
    function addTodo(content) {
        if (!content.trim()) return;

        const newTodo = {
            id: generateId(),
            content: content.trim()
        };

        todos.push(newTodo);
        saveTodos();

        // 显示添加成功的提示
        showNotification('已添加到待办事项');
    }

    // 显示通知
    function showNotification(message) {
        const notification = document.createElement('div');
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #4CAF50;
            color: white;
            padding: 12px 20px;
            border-radius: 4px;
            font-size: 14px;
            z-index: 10001;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            font-family: Arial, sans-serif;
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            document.body.removeChild(notification);
        }, 2000);
    }

    // 右键点击事件
    document.addEventListener('contextmenu', function(e) {
        const selection = window.getSelection().toString().trim();

        if (selection) {
            // 阻止默认右键菜单
            e.preventDefault();

            // 显示自定义菜单
            showMenu(e.pageX, e.pageY);

            // 设置点击事件
            const clickHandler = function() {
                addTodo(selection);
                hideMenu();
                menuItem.removeEventListener('click', clickHandler);
            };

            menuItem.addEventListener('click', clickHandler);
        } else {
            hideMenu();
        }
    });

    // 点击其他地方隐藏菜单
    document.addEventListener('click', function(e) {
        if (e.target !== menuItem) {
            hideMenu();
        }
    });

    // 键盘事件隐藏菜单
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            hideMenu();
        }
    });

    // 监听localStorage变化（用于多标签页同步）
    window.addEventListener('storage', function(e) {
        if (e.key === 'webTodos') {
            todos = JSON.parse(e.newValue || '[]');
        }
    });

    console.log('网页选中文本转待办事项脚本已加载');
    console.log('当前待办事项数量:', todos.length);

    // 添加一个查看待办事项的函数（可选，用于调试）
    window.viewTodos = function() {
        console.log('当前待办事项:', todos);
        return todos;
    };

    // 添加一个清空待办事项的函数（可选，用于调试）
    window.clearTodos = function() {
        todos = [];
        saveTodos();
        console.log('待办事项已清空');
    };
})();
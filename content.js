/* === content.js (バージョン1.8 メッセージ表示修正版) === */
/*
  修正点：
  - ツールバーから起動した際に、黄色いメッセージバーが正しく表示されるように修正しました。
  - プログラム全体の構造を整理し、より安定して動作するようにしました。
*/
(function() {

  // --- 初期化と状態管理 ---
  // すでに起動中の場合は、モードを終了させてから再起動する
  if (typeof window.erabeeController !== 'undefined') {
      window.erabeeController.terminate();
  }

  // --- メインコントローラーオブジェクト ---
  window.erabeeController = {
    isActive: false,
    lastRightClickEvent: null,
    ui: {
      topMessageDiv: null,
      actionMenuDiv: null,
    },
    boundListeners: {},

    // 初期化（スクリプトが注入されるたびに実行）
    initialize: function() {
        // 右クリックイベントを補足するためのリスナーを常時設置
        // Note: このリスナーはページの生存期間中、1回だけ設定されるべきだが、
        // 簡易的な拡張機能のため、ここでは毎回リセットされる前提で進める
        document.addEventListener('mousedown', (event) => {
            if (event.button === 2) { // 2は右クリック
                this.lastRightClickEvent = event;
            }
        }, true);
        
        // メソッドを自身のthisに束縛して、参照がずれないようにする
        this.boundListeners.pageClickHandler = (event) => this.handlePageClick(event);
        this.boundListeners.terminateHandler = () => this.terminate();
        
        this.determineStartMethod();
    },

    // 起動方法を判断する
    determineStartMethod: function() {
        // 直近の右クリックから100ミリ秒以内にスクリプトが実行されたら、コンテキストメニュー経由と判断
        if (this.lastRightClickEvent && (new Date().getTime() - this.lastRightClickEvent.timeStamp < 150)) {
            this.startAsContextMenu(this.lastRightClickEvent);
        } else {
            this.startAsToolbarMode();
        }
    },

    // A. ツールバーモードとして起動
    startAsToolbarMode: function() {
      this.isActive = true;
      document.body.style.cursor = 'pointer';
      // ★★★★★ ここでメッセージバーを表示します ★★★★★
      this.showTopMessage('えらびたいところをおしてください。(もういちどアイコンでキャンセル)');
      document.addEventListener('click', this.boundListeners.pageClickHandler, true);
    },

    // B. コンテキストメニューとして起動
    startAsContextMenu: function(event) {
        this.isActive = true;
        const clickedElement = event.target;
        const targetElement = this.findTargetElement(clickedElement);
        if (targetElement) {
            this.showActionMenu(event, targetElement);
        } else {
            this.terminate(); 
        }
    },
    
    terminate: function() {
        if (!this.isActive && !this.ui.actionMenuDiv) return; // 二重終了を防止
        this.isActive = false;
        document.body.style.cursor = 'default';
        this.hideTopMessage();
        this.hideActionMenu();
        document.removeEventListener('click', this.boundListeners.pageClickHandler, true);
        delete window.erabeeController; // 後片付け
    },
    
    findTargetElement: function(clickedElement) {
        const targetSelectors = 'p, div, article, section, main, li, h1, h2, h3, h4, td';
        const targetElement = clickedElement.closest(targetSelectors);
        if (targetElement) {
            const text = targetElement.textContent.trim();
            const hasEnoughText = text.length > 15;
            const isNotJustAContainer = targetElement.querySelectorAll(targetSelectors).length < 5;
            if (hasEnoughText && isNotJustAContainer) {
                return targetElement;
            }
        }
        return null;
    },

    handlePageClick: function(event) {
        if (!this.isActive) return;
        if (event.target.closest('.erabee-ui-element')) return;
        const targetElement = this.findTargetElement(event.target);
        if (targetElement) {
            event.preventDefault();
            event.stopPropagation();
            this.showActionMenu(event, targetElement);
        } else {
            this.hideActionMenu();
        }
    },

    // --- UI関連のメソッド ---
    showTopMessage: function(text) {
      if (this.ui.topMessageDiv) {
        this.ui.topMessageDiv.remove();
      }
      this.ui.topMessageDiv = document.createElement('div');
      const div = this.ui.topMessageDiv;
      div.className = 'erabee-ui-element';
      div.style.position = 'fixed';
      div.style.top = '0';
      div.style.left = '0';
      div.style.width = '100%';
      div.style.backgroundColor = 'rgba(255, 235, 59, 0.95)';
      div.style.color = '#333';
      div.style.textAlign = 'center';
      div.style.padding = '10px';
      div.style.fontSize = '16px';
      div.style.zIndex = '999999';
      div.style.borderBottom = '2px solid #FBC02D';
      div.textContent = text;
      document.body.appendChild(div);
    },

    hideTopMessage: function() {
      if (this.ui.topMessageDiv && this.ui.topMessageDiv.parentNode) {
        this.ui.topMessageDiv.parentNode.removeChild(this.ui.topMessageDiv);
        this.ui.topMessageDiv = null;
      }
    },

    showActionMenu: function(event, element) {
        this.hideActionMenu();
        this.ui.actionMenuDiv = document.createElement('div');
        const div = this.ui.actionMenuDiv;
        div.className = 'erabee-ui-element';
        div.style.position = 'absolute';
        div.style.left = `${event.pageX + 5}px`;
        div.style.top = `${event.pageY + 5}px`;
        div.style.zIndex = '1000000';
        div.style.backgroundColor = 'white';
        div.style.border = '1px solid #ccc';
        div.style.borderRadius = '8px';
        div.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
        div.style.padding = '5px';
        document.body.appendChild(div);

        const selectButton = document.createElement('button');
        selectButton.textContent = 'ここをえらぶ';
        this.styleMenuButton(selectButton);
        selectButton.onclick = () => {
            this.selectText(element);
            this.terminate();
        };
        
        const copyButton = document.createElement('button');
        copyButton.textContent = 'えらんでコピー';
        this.styleMenuButton(copyButton);
        copyButton.onclick = () => {
            const textToCopy = element.textContent.trim();
            if (textToCopy) {
                navigator.clipboard.writeText(textToCopy).then(() => {
                    this.selectText(element);
                    this.terminate();
                });
            }
        };
        
        div.appendChild(selectButton);
        div.appendChild(copyButton);
        
        setTimeout(() => document.addEventListener('click', this.boundListeners.terminateHandler, { once: true }), 0);
    },

    hideActionMenu: function() {
      if (this.ui.actionMenuDiv && this.ui.actionMenuDiv.parentNode) {
        this.ui.actionMenuDiv.parentNode.removeChild(this.ui.actionMenuDiv);
        this.ui.actionMenuDiv = null;
      }
    },

    styleMenuButton: function(button) {
      button.style.display = 'block';
      button.style.width = '100%';
      button.style.padding = '8px 12px';
      button.style.margin = '4px 0';
      button.style.border = '1px solid #ddd';
      button.style.borderRadius = '4px';
      button.style.backgroundColor = '#f9f9f9';
      button.style.cursor = 'pointer';
      button.style.textAlign = 'left';
      button.onmouseover = () => button.style.backgroundColor = '#e9e9e9';
      button.onmouseout = () => button.style.backgroundColor = '#f9f9f9';
    },

    selectText: function(element) {
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(element);
      selection.removeAllRanges();
      selection.addRange(range);
    }
  };

  window.erabeeController.initialize();
})();

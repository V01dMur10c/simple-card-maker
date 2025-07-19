// 数据编辑器类
class DataEditor {
    constructor() {
        this.data = [];
        this.currentCardIndex = -1;
        this.originalData = null;
        
        this.init();
    }

    init() {
        this.bindEvents();
        this.updateUI();
    }

    bindEvents() {
        // 头部按钮事件
        document.getElementById('btn-add-card').addEventListener('click', () => this.addCard());
        document.getElementById('btn-save-data').addEventListener('click', () => this.saveData());
        document.getElementById('btn-cancel').addEventListener('click', () => this.cancel());

        // 卡牌编辑器按钮事件
        document.getElementById('btn-delete-card').addEventListener('click', () => this.deleteCard());
        document.getElementById('btn-add-field').addEventListener('click', () => this.addField());

        // IPC事件
        const { ipcRenderer } = require('electron');
        ipcRenderer.on('load-data', (event, data) => {
            this.loadData(data);
        });
    }

    loadData(data) {
        try {
            if (typeof data === 'string') {
                this.data = JSON.parse(data);
            } else if (Array.isArray(data)) {
                this.data = data;
            } else {
                this.data = [];
            }
            
            this.originalData = JSON.parse(JSON.stringify(this.data));
            this.currentCardIndex = -1;
            this.updateUI();
        } catch (error) {
            console.error('加载数据失败:', error);
            this.data = [];
            this.updateUI();
        }
    }

    updateUI() {
        this.updateCardsList();
        this.updateCardEditor();
        this.updateJsonPreview();
    }

    updateCardsList() {
        const cardsList = document.getElementById('cards-list');
        cardsList.innerHTML = '';

        this.data.forEach((card, index) => {
            const cardItem = document.createElement('div');
            cardItem.className = 'card-item';
            if (index === this.currentCardIndex) {
                cardItem.classList.add('selected');
            }

            const cardName = document.createElement('span');
            cardName.className = 'card-item-name';
            
            // 尝试从卡牌数据中获取名称
            const name = card.name || card.title || card.cardName || `卡牌 ${index + 1}`;
            cardName.textContent = name;

            const cardIndex = document.createElement('span');
            cardIndex.className = 'card-item-index';
            cardIndex.textContent = `#${index + 1}`;

            cardItem.appendChild(cardName);
            cardItem.appendChild(cardIndex);

            cardItem.addEventListener('click', () => {
                this.selectCard(index);
            });

            cardsList.appendChild(cardItem);
        });
    }

    selectCard(index) {
        this.currentCardIndex = index;
        this.updateUI();
    }

    updateCardEditor() {
        const noCardSelected = document.getElementById('no-card-selected');
        const cardEditor = document.getElementById('card-editor');

        if (this.currentCardIndex === -1 || !this.data[this.currentCardIndex]) {
            noCardSelected.style.display = 'flex';
            cardEditor.style.display = 'none';
            return;
        }

        noCardSelected.style.display = 'none';
        cardEditor.style.display = 'flex';

        const currentCard = this.data[this.currentCardIndex];
        
        // 更新标题
        const title = document.getElementById('current-card-title');
        const cardName = currentCard.name || currentCard.title || currentCard.cardName || `卡牌 ${this.currentCardIndex + 1}`;
        title.textContent = cardName;

        // 更新字段编辑器
        this.updateFieldsContainer(currentCard);
    }

    updateFieldsContainer(card) {
        const fieldsContainer = document.getElementById('fields-container');
        fieldsContainer.innerHTML = '';

        Object.keys(card).forEach(key => {
            this.createFieldEditor(key, card[key], fieldsContainer);
        });
    }

    createFieldEditor(key, value, container) {
        const fieldEditor = document.createElement('div');
        fieldEditor.className = 'field-editor';

        const fieldHeader = document.createElement('div');
        fieldHeader.className = 'field-header';

        const fieldName = document.createElement('span');
        fieldName.className = 'field-name';
        fieldName.textContent = key;

        const fieldActions = document.createElement('div');
        fieldActions.className = 'field-actions';

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'field-btn delete';
        deleteBtn.textContent = '删除';
        deleteBtn.addEventListener('click', () => {
            this.deleteField(key);
        });

        fieldActions.appendChild(deleteBtn);
        fieldHeader.appendChild(fieldName);
        fieldHeader.appendChild(fieldActions);

        const fieldContent = document.createElement('div');
        fieldContent.className = 'field-content';

        // 字段名编辑
        const nameRow = document.createElement('div');
        nameRow.className = 'field-row';

        const nameLabel = document.createElement('label');
        nameLabel.textContent = '字段名:';

        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.value = key;
        nameInput.addEventListener('input', (e) => {
            this.renameField(key, e.target.value);
        });

        nameRow.appendChild(nameLabel);
        nameRow.appendChild(nameInput);

        // 字段值编辑
        const valueRow = document.createElement('div');
        valueRow.className = 'field-row';

        const valueLabel = document.createElement('label');
        valueLabel.textContent = '字段值:';

        let valueInput;
        if (typeof value === 'string' && value.length > 50) {
            valueInput = document.createElement('textarea');
            valueInput.rows = 3;
        } else {
            valueInput = document.createElement('input');
            valueInput.type = this.getInputType(value);
        }

        valueInput.value = this.formatValue(value);
        valueInput.addEventListener('input', (e) => {
            this.updateFieldValue(key, e.target.value);
        });

        valueRow.appendChild(valueLabel);
        valueRow.appendChild(valueInput);

        fieldContent.appendChild(nameRow);
        fieldContent.appendChild(valueRow);

        fieldEditor.appendChild(fieldHeader);
        fieldEditor.appendChild(fieldContent);

        container.appendChild(fieldEditor);
    }

    getInputType(value) {
        if (typeof value === 'number') {
            return 'number';
        } else if (typeof value === 'boolean') {
            return 'checkbox';
        } else if (typeof value === 'string' && value.match(/^https?:\/\//)) {
            return 'url';
        } else if (typeof value === 'string' && value.match(/^\S+@\S+\.\S+$/)) {
            return 'email';
        } else {
            return 'text';
        }
    }

    formatValue(value) {
        if (typeof value === 'object') {
            return JSON.stringify(value, null, 2);
        }
        return String(value);
    }

    parseValue(value, originalType) {
        if (originalType === 'number') {
            const num = parseFloat(value);
            return isNaN(num) ? 0 : num;
        } else if (originalType === 'boolean') {
            return value === 'true' || value === true;
        } else if (originalType === 'object') {
            try {
                return JSON.parse(value);
            } catch {
                return value;
            }
        }
        return value;
    }

    addCard() {
        const newCard = {
            name: `新卡牌 ${this.data.length + 1}`,
            description: '描述',
            value: 0
        };

        this.data.push(newCard);
        this.currentCardIndex = this.data.length - 1;
        this.updateUI();
    }

    deleteCard() {
        if (this.currentCardIndex >= 0 && this.currentCardIndex < this.data.length) {
            if (confirm('确定要删除这张卡牌吗？')) {
                this.data.splice(this.currentCardIndex, 1);
                this.currentCardIndex = Math.min(this.currentCardIndex, this.data.length - 1);
                if (this.currentCardIndex < 0 && this.data.length > 0) {
                    this.currentCardIndex = 0;
                }
                this.updateUI();
            }
        }
    }

    addField() {
        if (this.currentCardIndex >= 0 && this.currentCardIndex < this.data.length) {
            const fieldName = prompt('请输入字段名:');
            if (fieldName && fieldName.trim()) {
                const trimmedName = fieldName.trim();
                if (!this.data[this.currentCardIndex].hasOwnProperty(trimmedName)) {
                    this.data[this.currentCardIndex][trimmedName] = '';
                    this.updateUI();
                } else {
                    alert('字段名已存在！');
                }
            }
        }
    }

    deleteField(fieldName) {
        if (this.currentCardIndex >= 0 && this.currentCardIndex < this.data.length) {
            if (confirm(`确定要删除字段 "${fieldName}" 吗？`)) {
                delete this.data[this.currentCardIndex][fieldName];
                this.updateUI();
            }
        }
    }

    renameField(oldName, newName) {
        if (this.currentCardIndex >= 0 && this.currentCardIndex < this.data.length) {
            const card = this.data[this.currentCardIndex];
            if (newName && newName.trim() && newName !== oldName) {
                const trimmedName = newName.trim();
                if (!card.hasOwnProperty(trimmedName)) {
                    const value = card[oldName];
                    delete card[oldName];
                    card[trimmedName] = value;
                    this.updateUI();
                }
            }
        }
    }

    updateFieldValue(fieldName, value) {
        if (this.currentCardIndex >= 0 && this.currentCardIndex < this.data.length) {
            const card = this.data[this.currentCardIndex];
            const originalType = typeof card[fieldName];
            card[fieldName] = this.parseValue(value, originalType);
            this.updateJsonPreview();
        }
    }

    updateJsonPreview() {
        const jsonPreview = document.getElementById('json-preview');
        try {
            jsonPreview.value = JSON.stringify(this.data, null, 2);
        } catch (error) {
            jsonPreview.value = '数据格式错误';
        }
    }

    saveData() {
        try {
            const { ipcRenderer } = require('electron');
            
            // 发送数据回主窗口
            ipcRenderer.send('data-editor-save', this.data);
            
            // 关闭窗口
            ipcRenderer.invoke('close-data-editor');
        } catch (error) {
            console.error('保存数据失败:', error);
            alert('保存数据失败: ' + error.message);
        }
    }

    cancel() {
        if (this.hasChanges()) {
            if (confirm('有未保存的更改，确定要取消吗？')) {
                const { ipcRenderer } = require('electron');
                ipcRenderer.invoke('close-data-editor');
            }
        } else {
            const { ipcRenderer } = require('electron');
            ipcRenderer.invoke('close-data-editor');
        }
    }

    hasChanges() {
        if (!this.originalData) return false;
        return JSON.stringify(this.data) !== JSON.stringify(this.originalData);
    }
}

// 启动数据编辑器
document.addEventListener('DOMContentLoaded', () => {
    window.dataEditor = new DataEditor();
});


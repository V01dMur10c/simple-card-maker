// 主应用类
class CardMakerApp {
    constructor() {
        this.canvas = null;
        this.currentProject = {
            name: '未命名项目',
            cardWidth: 252,
            cardHeight: 352,
            elements: [],
            template: null,
            data: []
        };
        this.selectedObject = null;
        this.systemFonts = [];
        this.undoStack = [];
        this.redoStack = [];
        this.maxUndoSteps = 50;
        
        this.init();
    }

    async init() {
        try {
            console.log('开始初始化卡牌制作应用...');
            
            // 检查Fabric.js是否加载
            if (typeof fabric === 'undefined') {
                console.error('Fabric.js 未加载！');
                this.updateStatus('Fabric.js 加载失败');
                return;
            }
            console.log('Fabric.js 已加载，版本:', fabric.version);
            
            // 初始化画布
            this.initCanvas();
            console.log('画布初始化完成');
            
            // 绑定事件
            this.bindEvents();
            console.log('事件绑定完成');
            
            // 加载系统字体
            await this.loadSystemFonts();
            console.log('系统字体加载完成');
            
            // 初始化界面
            this.updateUI();
            console.log('界面初始化完成');
            
            console.log('卡牌制作应用初始化完成');
            this.updateStatus('应用已就绪');
        } catch (error) {
            console.error('应用初始化失败:', error);
            this.updateStatus('初始化失败: ' + error.message);
        }
    }

    initCanvas() {
        const canvasElement = document.getElementById('card-canvas');
        this.canvas = new fabric.Canvas(canvasElement, {
            width: this.currentProject.cardWidth,
            height: this.currentProject.cardHeight,
            backgroundColor: '#ffffff',
            selection: true,
            preserveObjectStacking: true
        });

        // 画布事件
        this.canvas.on('selection:created', (e) => {
            this.selectedObject = e.selected && e.selected[0] ? e.selected[0] : null;
            this.updatePropertiesPanel();
            this.updateLayersList();
        });

        this.canvas.on('selection:updated', (e) => {
            this.selectedObject = e.selected && e.selected[0] ? e.selected[0] : null;
            this.updatePropertiesPanel();
            this.updateLayersList();
        });

        this.canvas.on('selection:cleared', () => {
            this.selectedObject = null;
            this.updatePropertiesPanel();
            this.updateLayersList();
        });

        this.canvas.on('object:modified', () => {
            this.saveState();
            this.updatePropertiesPanel();
        });

        this.canvas.on('object:added', () => {
            this.updateLayersList();
        });

        this.canvas.on('object:removed', () => {
            this.updateLayersList();
        });
    }

    bindEvents() {
        console.log('开始绑定事件...');
        
        // 工具栏按钮
        const btnNew = document.getElementById('btn-new');
        const btnOpen = document.getElementById('btn-open');
        const btnSave = document.getElementById('btn-save');
        const btnImportData = document.getElementById('btn-import-data');
        const btnExport = document.getElementById('btn-export');
        
        if (btnNew) {
            btnNew.addEventListener('click', () => {
                console.log('新建按钮被点击');
                this.newProject();
            });
        } else {
            console.error('找不到新建按钮');
        }
        
        if (btnOpen) {
            btnOpen.addEventListener('click', () => {
                console.log('打开按钮被点击');
                this.openProject();
            });
        } else {
            console.error('找不到打开按钮');
        }
        
        if (btnSave) {
            btnSave.addEventListener('click', () => {
                console.log('保存按钮被点击');
                this.saveProject();
            });
        } else {
            console.error('找不到保存按钮');
        }
        
        if (btnImportData) {
            btnImportData.addEventListener('click', () => {
                console.log('导入数据按钮被点击');
                this.importData();
            });
        } else {
            console.error('找不到导入数据按钮');
        }
        
        if (btnExport) {
            btnExport.addEventListener('click', () => {
                console.log('导出按钮被点击');
                this.showExportDialog();
            });
        } else {
            console.error('找不到导出按钮');
        }

        // 添加控件按钮
        const btnAddText = document.getElementById('btn-add-text');
        const btnAddVariableText = document.getElementById('btn-add-variable-text');
        const btnAddImage = document.getElementById('btn-add-image');
        const btnAddVariableImage = document.getElementById('btn-add-variable-image');
        
        if (btnAddText) {
            btnAddText.addEventListener('click', () => {
                console.log('添加文字按钮被点击');
                this.addText();
            });
        } else {
            console.error('找不到添加文字按钮');
        }
        
        if (btnAddVariableText) {
            btnAddVariableText.addEventListener('click', () => {
                console.log('添加变量文字按钮被点击');
                this.addVariableText();
            });
        } else {
            console.error('找不到添加变量文字按钮');
        }
        
        if (btnAddImage) {
            btnAddImage.addEventListener('click', () => {
                console.log('添加图片按钮被点击');
                this.addImage();
            });
        } else {
            console.error('找不到添加图片按钮');
        }
        
        if (btnAddVariableImage) {
            btnAddVariableImage.addEventListener('click', () => {
                console.log('添加变量图片按钮被点击');
                this.addVariableImage();
            });
        } else {
            console.error('找不到添加变量图片按钮');
        }

        // 卡牌尺寸设置
        const cardPreset = document.getElementById('card-preset');
        const btnApplySize = document.getElementById('btn-apply-size');
        
        if (cardPreset) {
            cardPreset.addEventListener('change', (e) => this.applyCardPreset(e.target.value));
        }
        
        if (btnApplySize) {
            btnApplySize.addEventListener('click', () => this.applyCardSize());
        }

        // 属性面板事件
        this.bindPropertyEvents();

        // 导出对话框事件
        this.bindExportDialogEvents();

        // 菜单事件
        this.bindMenuEvents();

        // 键盘快捷键
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
        
        console.log('事件绑定完成');
    }

    bindPropertyEvents() {
        // 通用属性
        ['prop-x', 'prop-y', 'prop-width', 'prop-height', 'prop-angle'].forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('input', () => this.updateObjectProperties());
            }
        });

        // 文字属性
        ['prop-text-content', 'prop-font-family', 'prop-font-size', 'prop-text-color', 'prop-font-bold', 'prop-font-italic'].forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('input', () => this.updateTextProperties());
                element.addEventListener('change', () => this.updateTextProperties());
            }
        });

        // 变量文字属性
        ['prop-variable-name', 'prop-default-text'].forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('input', () => this.updateVariableTextProperties());
            }
        });

        // 图片属性
        document.getElementById('prop-image-file').addEventListener('change', (e) => this.updateImageFile(e));
        document.getElementById('btn-fit-image').addEventListener('click', () => this.fitImageToSize());

        // 变量图片属性
        ['prop-image-variable-name'].forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('input', () => this.updateVariableImageProperties());
            }
        });
        document.getElementById('prop-default-image').addEventListener('change', (e) => this.updateDefaultImage(e));
    }

    bindExportDialogEvents() {
        document.getElementById('export-format').addEventListener('change', (e) => {
            const layoutOptions = document.getElementById('layout-options');
            layoutOptions.style.display = e.target.value === 'layout' ? 'block' : 'none';
        });

        document.getElementById('btn-export-confirm').addEventListener('click', () => this.exportImages());
        document.getElementById('btn-export-cancel').addEventListener('click', () => this.hideExportDialog());
        
        document.querySelector('#export-dialog .modal-close').addEventListener('click', () => this.hideExportDialog());
    }

    bindMenuEvents() {
        const { ipcRenderer } = require('electron');

        ipcRenderer.on('menu-new-project', () => this.newProject());
        ipcRenderer.on('menu-open-project', (event, filePath) => this.loadProjectFile(filePath));
        ipcRenderer.on('menu-save-project', () => this.saveProject());
        ipcRenderer.on('menu-import-data', (event, filePath) => this.loadDataFile(filePath));
        ipcRenderer.on('menu-export-images', () => this.showExportDialog());
        ipcRenderer.on('menu-undo', () => this.undo());
        ipcRenderer.on('menu-redo', () => this.redo());
        ipcRenderer.on('menu-copy', () => this.copyObject());
        ipcRenderer.on('menu-paste', () => this.pasteObject());
        ipcRenderer.on('menu-delete', () => this.deleteObject());
        
        // 数据编辑器事件
        ipcRenderer.on('data-updated', (event, data) => {
            this.currentProject.data = data;
            this.updateStatus('数据已更新');
        });
    }

    async loadSystemFonts() {
        try {
            const { ipcRenderer } = require('electron');
            this.systemFonts = await ipcRenderer.invoke('get-system-fonts');
            
            // 更新字体选择器
            const fontSelect = document.getElementById('prop-font-family');
            fontSelect.innerHTML = '';
            this.systemFonts.forEach(font => {
                const option = document.createElement('option');
                option.value = font;
                option.textContent = font;
                fontSelect.appendChild(option);
            });
        } catch (error) {
            console.error('加载系统字体失败:', error);
            // 使用默认字体
            this.systemFonts = ['Arial', 'Helvetica', 'Times New Roman', 'Courier New'];
        }
    }

    // 卡牌尺寸预设
    applyCardPreset(preset) {
        const presets = {
            poker: { width: 252, height: 352 }, // 63×88mm at 300dpi
            bridge: { width: 228, height: 356 }, // 57×89mm at 300dpi
            tarot: { width: 280, height: 480 }, // 70×120mm at 300dpi
            custom: null
        };

        if (presets[preset]) {
            document.getElementById('card-width').value = presets[preset].width;
            document.getElementById('card-height').value = presets[preset].height;
            this.applyCardSize();
        }
    }

    applyCardSize() {
        const width = parseInt(document.getElementById('card-width').value);
        const height = parseInt(document.getElementById('card-height').value);

        if (width > 0 && height > 0) {
            this.currentProject.cardWidth = width;
            this.currentProject.cardHeight = height;
            this.canvas.setDimensions({ width, height });
            this.saveState();
            this.updateStatus('卡牌尺寸已更新');
        }
    }

    // 添加控件方法
    addText() {
        const text = new fabric.Text('文字', {
            left: 50,
            top: 50,
            fontFamily: 'Arial',
            fontSize: 16,
            fill: '#000000'
        });

        text.set('elementType', 'text');
        text.set('elementId', this.generateId());
        
        this.canvas.add(text);
        this.canvas.setActiveObject(text);
        this.saveState();
        this.updateStatus('已添加文字');
    }

    addVariableText() {
        const text = new fabric.Text('{{变量文字}}', {
            left: 50,
            top: 100,
            fontFamily: 'Arial',
            fontSize: 16,
            fill: '#000000'
        });

        text.set('elementType', 'variableText');
        text.set('elementId', this.generateId());
        text.set('variableName', '');
        text.set('defaultText', '{{变量文字}}');
        
        this.canvas.add(text);
        this.canvas.setActiveObject(text);
        this.saveState();
        this.updateStatus('已添加变量文字');
    }

    addImage() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    fabric.Image.fromURL(event.target.result).then((img) => {
                        img.set({
                            left: 50,
                            top: 150,
                            scaleX: 0.5,
                            scaleY: 0.5
                        });

                        img.set('elementType', 'image');
                        img.set('elementId', this.generateId());
                        img.set('originalSrc', event.target.result);
                        
                        this.canvas.add(img);
                        this.canvas.setActiveObject(img);
                        this.saveState();
                        this.updateStatus('已添加图片');
                    }).catch((error) => {
                        console.error('加载图片失败:', error);
                        this.updateStatus('加载图片失败');
                    });
                };
                reader.readAsDataURL(file);
            }
        };
        input.click();
    }

    addVariableImage() {
        // 创建一个占位符图片
        const rect = new fabric.Rect({
            left: 50,
            top: 200,
            width: 100,
            height: 100,
            fill: '#f0f0f0',
            stroke: '#ccc',
            strokeWidth: 2,
            strokeDashArray: [5, 5]
        });

        // 添加文字标识
        const text = new fabric.Text('变量图片', {
            left: 75,
            top: 225,
            fontSize: 12,
            fill: '#666',
            textAlign: 'center'
        });

        const group = new fabric.Group([rect, text], {
            left: 50,
            top: 200
        });

        group.set('elementType', 'variableImage');
        group.set('elementId', this.generateId());
        group.set('variableName', '');
        group.set('defaultSrc', null);
        
        this.canvas.add(group);
        this.canvas.setActiveObject(group);
        this.saveState();
        this.updateStatus('已添加变量图片');
    }

    // 属性更新方法
    updateObjectProperties() {
        if (!this.selectedObject) return;

        const x = parseFloat(document.getElementById('prop-x').value) || 0;
        const y = parseFloat(document.getElementById('prop-y').value) || 0;
        const width = parseFloat(document.getElementById('prop-width').value) || 1;
        const height = parseFloat(document.getElementById('prop-height').value) || 1;
        const angle = parseFloat(document.getElementById('prop-angle').value) || 0;

        this.selectedObject.set({
            left: x,
            top: y,
            angle: angle
        });

        // 对于文字对象，设置字体大小而不是缩放
        if (this.selectedObject.type === 'text') {
            this.selectedObject.set({
                fontSize: height
            });
        } else {
            // 对于其他对象，计算缩放比例
            const currentWidth = this.selectedObject.getScaledWidth();
            const currentHeight = this.selectedObject.getScaledHeight();
            
            if (currentWidth > 0 && currentHeight > 0) {
                this.selectedObject.set({
                    scaleX: (width / currentWidth) * this.selectedObject.scaleX,
                    scaleY: (height / currentHeight) * this.selectedObject.scaleY
                });
            }
        }

        this.canvas.renderAll();
        this.saveState();
    }

    updateTextProperties() {
        if (!this.selectedObject || this.selectedObject.type !== 'text') return;

        const content = document.getElementById('prop-text-content').value;
        const fontFamily = document.getElementById('prop-font-family').value;
        const fontSize = parseInt(document.getElementById('prop-font-size').value) || 16;
        const color = document.getElementById('prop-text-color').value;
        const bold = document.getElementById('prop-font-bold').checked;
        const italic = document.getElementById('prop-font-italic').checked;

        this.selectedObject.set({
            text: content,
            fontFamily: fontFamily,
            fontSize: fontSize,
            fill: color,
            fontWeight: bold ? 'bold' : 'normal',
            fontStyle: italic ? 'italic' : 'normal'
        });

        this.canvas.renderAll();
        this.saveState();
    }

    updateVariableTextProperties() {
        if (!this.selectedObject || this.selectedObject.get('elementType') !== 'variableText') return;

        const variableName = document.getElementById('prop-variable-name').value;
        const defaultText = document.getElementById('prop-default-text').value;

        this.selectedObject.set('variableName', variableName);
        this.selectedObject.set('defaultText', defaultText);
        
        // 更新显示文字
        const displayText = defaultText || `{{${variableName || '变量'}}}`;
        this.selectedObject.set('text', displayText);

        this.canvas.renderAll();
        this.saveState();
    }

    updateImageFile(event) {
        if (!this.selectedObject || this.selectedObject.get('elementType') !== 'image') return;

        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                fabric.Image.fromURL(e.target.result).then((img) => {
                    // 保持当前位置和尺寸
                    const currentLeft = this.selectedObject.left;
                    const currentTop = this.selectedObject.top;
                    const currentScaleX = this.selectedObject.scaleX;
                    const currentScaleY = this.selectedObject.scaleY;

                    // 移除旧图片
                    this.canvas.remove(this.selectedObject);

                    // 添加新图片
                    img.set({
                        left: currentLeft,
                        top: currentTop,
                        scaleX: currentScaleX,
                        scaleY: currentScaleY
                    });

                    img.set('elementType', 'image');
                    img.set('elementId', this.selectedObject.get('elementId'));
                    img.set('originalSrc', e.target.result);

                    this.canvas.add(img);
                    this.canvas.setActiveObject(img);
                    this.selectedObject = img;
                    this.saveState();
                    this.updateStatus('图片已更新');
                }).catch((error) => {
                    console.error('更新图片失败:', error);
                    this.updateStatus('更新图片失败');
                });
            };
            reader.readAsDataURL(file);
        }
    }

    fitImageToSize() {
        if (!this.selectedObject || this.selectedObject.get('elementType') !== 'image') return;

        const canvasWidth = this.canvas.getWidth();
        const canvasHeight = this.canvas.getHeight();
        const imgWidth = this.selectedObject.getScaledWidth();
        const imgHeight = this.selectedObject.getScaledHeight();

        const scaleX = (canvasWidth * 0.8) / imgWidth;
        const scaleY = (canvasHeight * 0.8) / imgHeight;
        const scale = Math.min(scaleX, scaleY);

        this.selectedObject.set({
            scaleX: scale,
            scaleY: scale
        });

        this.canvas.renderAll();
        this.updatePropertiesPanel();
        this.saveState();
    }

    updateVariableImageProperties() {
        if (!this.selectedObject || this.selectedObject.get('elementType') !== 'variableImage') return;

        const variableName = document.getElementById('prop-image-variable-name').value;
        this.selectedObject.set('variableName', variableName);
        this.saveState();
    }

    updateDefaultImage(event) {
        if (!this.selectedObject || this.selectedObject.get('elementType') !== 'variableImage') return;

        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                this.selectedObject.set('defaultSrc', e.target.result);
                this.saveState();
                this.updateStatus('默认图片已设置');
            };
            reader.readAsDataURL(file);
        }
    }

    // 属性面板更新
    updatePropertiesPanel() {
        // 隐藏所有属性面板
        document.getElementById('no-selection').style.display = 'block';
        document.getElementById('common-properties').style.display = 'none';
        document.getElementById('text-properties').style.display = 'none';
        document.getElementById('variable-text-properties').style.display = 'none';
        document.getElementById('image-properties').style.display = 'none';
        document.getElementById('variable-image-properties').style.display = 'none';

        if (!this.selectedObject) return;

        // 显示通用属性
        document.getElementById('no-selection').style.display = 'none';
        document.getElementById('common-properties').style.display = 'block';

        // 更新通用属性值
        document.getElementById('prop-x').value = Math.round(this.selectedObject.left * 100) / 100;
        document.getElementById('prop-y').value = Math.round(this.selectedObject.top * 100) / 100;
        document.getElementById('prop-angle').value = Math.round(this.selectedObject.angle || 0);

        if (this.selectedObject.type === 'text') {
            document.getElementById('prop-width').value = Math.round(this.selectedObject.getScaledWidth() * 100) / 100;
            document.getElementById('prop-height').value = this.selectedObject.fontSize;
        } else {
            document.getElementById('prop-width').value = Math.round(this.selectedObject.getScaledWidth() * 100) / 100;
            document.getElementById('prop-height').value = Math.round(this.selectedObject.getScaledHeight() * 100) / 100;
        }

        // 根据元素类型显示特定属性
        const elementType = this.selectedObject.get('elementType');
        
        if (elementType === 'text') {
            document.getElementById('text-properties').style.display = 'block';
            document.getElementById('prop-text-content').value = this.selectedObject.text || '';
            document.getElementById('prop-font-family').value = this.selectedObject.fontFamily || 'Arial';
            document.getElementById('prop-font-size').value = this.selectedObject.fontSize || 16;
            document.getElementById('prop-text-color').value = this.selectedObject.fill || '#000000';
            document.getElementById('prop-font-bold').checked = this.selectedObject.fontWeight === 'bold';
            document.getElementById('prop-font-italic').checked = this.selectedObject.fontStyle === 'italic';
        } else if (elementType === 'variableText') {
            document.getElementById('text-properties').style.display = 'block';
            document.getElementById('variable-text-properties').style.display = 'block';
            document.getElementById('prop-text-content').value = this.selectedObject.text || '';
            document.getElementById('prop-font-family').value = this.selectedObject.fontFamily || 'Arial';
            document.getElementById('prop-font-size').value = this.selectedObject.fontSize || 16;
            document.getElementById('prop-text-color').value = this.selectedObject.fill || '#000000';
            document.getElementById('prop-font-bold').checked = this.selectedObject.fontWeight === 'bold';
            document.getElementById('prop-font-italic').checked = this.selectedObject.fontStyle === 'italic';
            document.getElementById('prop-variable-name').value = this.selectedObject.get('variableName') || '';
            document.getElementById('prop-default-text').value = this.selectedObject.get('defaultText') || '';
        } else if (elementType === 'image') {
            document.getElementById('image-properties').style.display = 'block';
        } else if (elementType === 'variableImage') {
            document.getElementById('variable-image-properties').style.display = 'block';
            document.getElementById('prop-image-variable-name').value = this.selectedObject.get('variableName') || '';
        }
    }

    // 图层列表更新
    updateLayersList() {
        const layersList = document.getElementById('layers-list');
        layersList.innerHTML = '';

        const objects = this.canvas.getObjects().slice().reverse(); // 反转以显示正确的层级顺序

        objects.forEach((obj, index) => {
            const layerItem = document.createElement('div');
            layerItem.className = 'layer-item';
            if (obj === this.selectedObject) {
                layerItem.classList.add('selected');
            }

            const layerName = document.createElement('span');
            layerName.className = 'layer-name';
            
            const elementType = obj.get('elementType') || obj.type;
            let name = '';
            
            switch (elementType) {
                case 'text':
                    name = `文字: ${obj.text?.substring(0, 10) || ''}`;
                    break;
                case 'variableText':
                    name = `变量文字: ${obj.get('variableName') || '未命名'}`;
                    break;
                case 'image':
                    name = '图片';
                    break;
                case 'variableImage':
                    name = `变量图片: ${obj.get('variableName') || '未命名'}`;
                    break;
                default:
                    name = obj.type;
            }
            
            layerName.textContent = name;

            const layerType = document.createElement('span');
            layerType.className = 'layer-type';
            layerType.textContent = elementType;

            layerItem.appendChild(layerName);
            layerItem.appendChild(layerType);

            layerItem.addEventListener('click', () => {
                this.canvas.setActiveObject(obj);
                this.canvas.renderAll();
            });

            layersList.appendChild(layerItem);
        });
    }

    // 工具方法
    generateId() {
        return 'element_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    updateStatus(message) {
        console.log('状态:', message);
        const statusElement = document.getElementById('status-text');
        if (statusElement) {
            statusElement.textContent = message;
            if (message !== '就绪' && message !== '应用已就绪') {
                setTimeout(() => {
                    statusElement.textContent = '就绪';
                }, 3000);
            }
        }
    }

    updateUI() {
        this.updatePropertiesPanel();
        this.updateLayersList();
        document.getElementById('card-width').value = this.currentProject.cardWidth;
        document.getElementById('card-height').value = this.currentProject.cardHeight;
    }

    // 状态保存和撤销重做
    saveState() {
        const state = JSON.stringify(this.canvas.toJSON(['elementType', 'elementId', 'variableName', 'defaultText', 'originalSrc', 'defaultSrc']));
        this.undoStack.push(state);
        
        if (this.undoStack.length > this.maxUndoSteps) {
            this.undoStack.shift();
        }
        
        this.redoStack = [];
    }

    undo() {
        if (this.undoStack.length > 1) {
            const currentState = this.undoStack.pop();
            this.redoStack.push(currentState);
            
            const previousState = this.undoStack[this.undoStack.length - 1];
            this.loadCanvasState(previousState);
            this.updateStatus('已撤销');
        }
    }

    redo() {
        if (this.redoStack.length > 0) {
            const state = this.redoStack.pop();
            this.undoStack.push(state);
            this.loadCanvasState(state);
            this.updateStatus('已重做');
        }
    }

    loadCanvasState(state) {
        this.canvas.loadFromJSON(state, () => {
            this.canvas.renderAll();
            this.selectedObject = null;
            this.updatePropertiesPanel();
            this.updateLayersList();
        });
    }

    // 键盘事件处理
    handleKeyboard(e) {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

        if (e.ctrlKey || e.metaKey) {
            switch (e.key) {
                case 'z':
                    e.preventDefault();
                    if (e.shiftKey) {
                        this.redo();
                    } else {
                        this.undo();
                    }
                    break;
                case 'y':
                    e.preventDefault();
                    this.redo();
                    break;
                case 'c':
                    e.preventDefault();
                    this.copyObject();
                    break;
                case 'v':
                    e.preventDefault();
                    this.pasteObject();
                    break;
                case 's':
                    e.preventDefault();
                    this.saveProject();
                    break;
                case 'n':
                    e.preventDefault();
                    this.newProject();
                    break;
                case 'o':
                    e.preventDefault();
                    this.openProject();
                    break;
            }
        } else if (e.key === 'Delete' || e.key === 'Backspace') {
            e.preventDefault();
            this.deleteObject();
        }
    }

    // 复制粘贴删除
    copyObject() {
        if (this.selectedObject) {
            this.clipboard = this.selectedObject.toObject(['elementType', 'elementId', 'variableName', 'defaultText', 'originalSrc', 'defaultSrc']);
            this.updateStatus('已复制');
        }
    }

    pasteObject() {
        if (this.clipboard) {
            fabric.util.enlivenObjects([this.clipboard], (objects) => {
                const obj = objects[0];
                obj.set({
                    left: obj.left + 20,
                    top: obj.top + 20,
                    elementId: this.generateId()
                });
                
                this.canvas.add(obj);
                this.canvas.setActiveObject(obj);
                this.saveState();
                this.updateStatus('已粘贴');
            });
        }
    }

    deleteObject() {
        if (this.selectedObject) {
            this.canvas.remove(this.selectedObject);
            this.selectedObject = null;
            this.saveState();
            this.updateStatus('已删除');
        }
    }

    // 项目管理方法
    async newProject() {
        if (confirm('确定要新建项目吗？未保存的更改将丢失。')) {
            this.currentProject = {
                name: '未命名项目',
                cardWidth: 252,
                cardHeight: 352,
                elements: [],
                template: null,
                data: []
            };
            this.canvas.clear();
            this.canvas.setDimensions({
                width: this.currentProject.cardWidth,
                height: this.currentProject.cardHeight
            });
            this.undoStack = [];
            this.redoStack = [];
            this.updateUI();
            this.updateStatus('新项目已创建');
        }
    }

    async openProject() {
        try {
            const { ipcRenderer } = require('electron');
            const result = await ipcRenderer.invoke('show-open-dialog', {
                properties: ['openFile'],
                filters: [
                    { name: '卡牌项目文件', extensions: ['json'] }
                ]
            });

            if (!result.canceled && result.filePaths.length > 0) {
                await this.loadProjectFile(result.filePaths[0]);
            }
        } catch (error) {
            console.error('打开项目失败:', error);
            this.updateStatus('打开项目失败');
        }
    }

    async saveProject() {
        try {
            const { ipcRenderer } = require('electron');
            
            // 保存当前画布状态到项目
            this.currentProject.elements = this.canvas.toJSON(['elementType', 'elementId', 'variableName', 'defaultText', 'originalSrc', 'defaultSrc']);
            
            const result = await ipcRenderer.invoke('show-save-dialog', {
                defaultPath: this.currentProject.name + '.json',
                filters: [
                    { name: '卡牌项目文件', extensions: ['json'] }
                ]
            });

            if (!result.canceled) {
                const projectData = JSON.stringify(this.currentProject, null, 2);
                const writeResult = await ipcRenderer.invoke('write-file', result.filePath, projectData);
                
                if (writeResult.success) {
                    this.updateStatus('项目已保存');
                } else {
                    throw new Error(writeResult.error);
                }
            }
        } catch (error) {
            console.error('保存项目失败:', error);
            this.updateStatus('保存项目失败');
        }
    }

    async importData() {
        try {
            const { ipcRenderer } = require('electron');
            const result = await ipcRenderer.invoke('show-open-dialog', {
                properties: ['openFile'],
                filters: [
                    { name: 'JSON文件', extensions: ['json'] }
                ]
            });

            if (!result.canceled && result.filePaths.length > 0) {
                await this.loadDataFile(result.filePaths[0]);
            }
        } catch (error) {
            console.error('导入数据失败:', error);
            this.updateStatus('导入数据失败');
        }
    }

    showExportDialog() {
        document.getElementById('export-dialog').style.display = 'flex';
    }

    hideExportDialog() {
        document.getElementById('export-dialog').style.display = 'none';
    }

    async exportImages() {
        try {
            const format = document.getElementById('export-format').value;
            const resolution = parseInt(document.getElementById('export-resolution').value);
            
            if (format === 'single') {
                await this.exportSingleImage(resolution);
            } else if (format === 'batch') {
                await this.exportBatchImages(resolution);
            } else if (format === 'layout') {
                const cols = parseInt(document.getElementById('layout-cols').value);
                const rows = parseInt(document.getElementById('layout-rows').value);
                await this.exportLayoutImage(resolution, cols, rows);
            }
            
            this.hideExportDialog();
        } catch (error) {
            console.error('导出失败:', error);
            this.updateStatus('导出失败');
        }
    }

    async exportSingleImage(resolution = 1) {
        const { ipcRenderer } = require('electron');
        
        const result = await ipcRenderer.invoke('show-save-dialog', {
            defaultPath: 'card.png',
            filters: [
                { name: 'PNG图片', extensions: ['png'] }
            ]
        });

        if (!result.canceled) {
            const dataURL = this.canvas.toDataURL({
                format: 'png',
                multiplier: resolution,
                quality: 1
            });

            // 将base64转换为buffer并保存
            const base64Data = dataURL.replace(/^data:image\/png;base64,/, '');
            const buffer = Buffer.from(base64Data, 'base64');
            
            const fs = require('fs');
            fs.writeFileSync(result.filePath, buffer);
            
            this.updateStatus('图片已导出');
        }
    }

    async exportBatchImages(resolution = 1) {
        if (!this.currentProject.data || this.currentProject.data.length === 0) {
            alert('请先导入卡牌数据');
            return;
        }

        const { ipcRenderer } = require('electron');
        const archiver = require('archiver');
        const fs = require('fs');
        const path = require('path');

        const result = await ipcRenderer.invoke('show-save-dialog', {
            defaultPath: 'cards.zip',
            filters: [
                { name: 'ZIP压缩包', extensions: ['zip'] }
            ]
        });

        if (!result.canceled) {
            const output = fs.createWriteStream(result.filePath);
            const archive = archiver('zip', { zlib: { level: 9 } });

            archive.pipe(output);

            // 为每张卡牌生成图片
            for (let i = 0; i < this.currentProject.data.length; i++) {
                const cardData = this.currentProject.data[i];
                
                // 渲染卡牌
                await this.renderCardWithData(cardData);
                
                const dataURL = this.canvas.toDataURL({
                    format: 'png',
                    multiplier: resolution,
                    quality: 1
                });

                const base64Data = dataURL.replace(/^data:image\/png;base64,/, '');
                const buffer = Buffer.from(base64Data, 'base64');
                
                const fileName = `card_${i + 1}.png`;
                archive.append(buffer, { name: fileName });
            }

            await archive.finalize();
            this.updateStatus('批量图片已导出');
        }
    }

    async exportLayoutImage(resolution = 1, cols = 3, rows = 3) {
        if (!this.currentProject.data || this.currentProject.data.length === 0) {
            alert('请先导入卡牌数据');
            return;
        }

        const { ipcRenderer } = require('electron');
        
        const result = await ipcRenderer.invoke('show-save-dialog', {
            defaultPath: 'cards_layout.png',
            filters: [
                { name: 'PNG图片', extensions: ['png'] }
            ]
        });

        if (!result.canceled) {
            const cardWidth = this.currentProject.cardWidth * resolution;
            const cardHeight = this.currentProject.cardHeight * resolution;
            const layoutWidth = cardWidth * cols;
            const layoutHeight = cardHeight * rows;

            // 创建临时画布
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = layoutWidth;
            tempCanvas.height = layoutHeight;
            const ctx = tempCanvas.getContext('2d');
            
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, layoutWidth, layoutHeight);

            const maxCards = Math.min(this.currentProject.data.length, cols * rows);
            
            for (let i = 0; i < maxCards; i++) {
                const cardData = this.currentProject.data[i];
                
                // 渲染卡牌
                await this.renderCardWithData(cardData);
                
                const dataURL = this.canvas.toDataURL({
                    format: 'png',
                    multiplier: resolution,
                    quality: 1
                });

                // 创建图片对象
                const img = new Image();
                await new Promise((resolve) => {
                    img.onload = resolve;
                    img.src = dataURL;
                });

                // 计算位置
                const col = i % cols;
                const row = Math.floor(i / cols);
                const x = col * cardWidth;
                const y = row * cardHeight;

                ctx.drawImage(img, x, y, cardWidth, cardHeight);
            }

            // 保存拼接图片
            const layoutDataURL = tempCanvas.toDataURL('image/png');
            const base64Data = layoutDataURL.replace(/^data:image\/png;base64,/, '');
            const buffer = Buffer.from(base64Data, 'base64');
            
            const fs = require('fs');
            fs.writeFileSync(result.filePath, buffer);
            
            this.updateStatus('排版图片已导出');
        }
    }

    async renderCardWithData(cardData) {
        // 保存当前状态
        const originalState = this.canvas.toJSON(['elementType', 'elementId', 'variableName', 'defaultText', 'originalSrc', 'defaultSrc']);

        // 渲染变量
        const objects = this.canvas.getObjects();
        for (const obj of objects) {
            const elementType = obj.get('elementType');
            
            if (elementType === 'variableText') {
                const variableName = obj.get('variableName');
                if (variableName && cardData.hasOwnProperty(variableName)) {
                    obj.set('text', String(cardData[variableName]));
                }
            } else if (elementType === 'variableImage') {
                const variableName = obj.get('variableName');
                if (variableName && cardData.hasOwnProperty(variableName)) {
                    const imagePath = cardData[variableName];
                    if (imagePath) {
                        // 这里应该加载图片，但为了简化，我们跳过
                        // 在实际应用中，需要处理图片路径和加载
                    }
                }
            }
        }

        this.canvas.renderAll();
        
        // 等待渲染完成
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    async loadProjectFile(filePath) {
        try {
            const { ipcRenderer } = require('electron');
            const result = await ipcRenderer.invoke('read-file', filePath);
            
            if (result.success) {
                const projectData = JSON.parse(result.data);
                this.currentProject = projectData;
                
                // 恢复画布
                if (this.currentProject.elements) {
                    this.canvas.loadFromJSON(this.currentProject.elements, () => {
                        this.canvas.renderAll();
                        this.updateUI();
                    });
                }
                
                // 恢复卡牌尺寸
                this.canvas.setDimensions({
                    width: this.currentProject.cardWidth,
                    height: this.currentProject.cardHeight
                });
                
                this.updateStatus('项目已加载');
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('加载项目失败:', error);
            this.updateStatus('加载项目失败');
        }
    }

    async loadDataFile(filePath) {
        try {
            const { ipcRenderer } = require('electron');
            const result = await ipcRenderer.invoke('read-file', filePath);
            
            if (result.success) {
                const data = JSON.parse(result.data);
                this.currentProject.data = Array.isArray(data) ? data : [data];
                
                // 打开数据编辑器
                await ipcRenderer.invoke('show-data-editor', this.currentProject.data);
                
                this.updateStatus('数据已导入');
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('加载数据失败:', error);
            this.updateStatus('加载数据失败');
        }
    }
}

// 应用启动
document.addEventListener('DOMContentLoaded', () => {
    window.app = new CardMakerApp();
});


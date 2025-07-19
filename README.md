# simple card maker

一个基于Electron的不专业桌游卡牌设计工具。

## 手动编译

### 安装依赖
```bash
npm install
```

### 编译

```bash
electron-builder -w portable --config.win.icon=assets/icon.png
```

## 数据格式

### JSON数据结构

可添加额外自定义字段，与变量文字、变量图片结合使用
```json
[
  {
    "name": "卡牌名称",
    "type": "卡牌类型",
    "cost": 3,
    "attack": 2,
    "health": 4,
    "description": "卡牌描述",
    "image": "图片文件名.png"
  }
]
```

### 变量命名规则

- 变量文字：在属性面板中设置变量名，如 `name`、`cost`
- 变量图片：设置变量名，数据中对应图片文件路径
- 数据字段名必须与变量名完全匹配

### 日志查看
- 开发者工具：F12打开控制台查看错误信息
- 主进程日志：查看终端输出

## 许可证

MIT License

## 更新日志

### v1.0.0
- 初始版本发布
- 支持基础卡牌设计功能
- 支持数据导入和批量导出
- 支持项目保存和模板功能


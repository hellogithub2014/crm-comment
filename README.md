# PC端通用评论组件

* 加载评论列表
* 列表分页
* 添加评论，提供了快捷键
* 加载过程中的骨架屏
* 刷新列表
* 获取评论数
* 回复功能

# 依赖

* jquery
* task-manage-utils.js提供的一些工具方法

# 用法

整个组件用`CrmComment`函数包装了起来，只需初始化它，就能自动拥有所有评论功能。初始化时需要提供一些选项：

1. 页面中需要提供一个用于放置整个评论区域的容器元素的id。
2. 提供主题类型和主题id，这两个是用于告诉后台，此评论区域是在讨论什么
3. 一些可选的回调函数
    1. 评论列表展示出来后的钩子
    2. 成功添加评论后的钩子
4. 是否有权限添加评论

示范：

```js
const crmComment = new CrmComment({
    subjectId: 123,
    subjectType: "ABC",
    "wrapper-selector": "#test-comment-warpper",
    canAddComment: true,
    cbAfterDisplayList: (list) => console.log(list.length),
    cbAfterAddComment: () => console.log(`评论数加1`),
});
```

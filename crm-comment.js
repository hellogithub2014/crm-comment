"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * 依赖 \business\page\task-manage\core\utils\task-manage-utils.js 提供的工具方法
 *
 * @author 80374787 刘斌
 * @export
 * @class CrmComment
 */
var CrmComment = function () {
    /**
     * Creates an instance of CrmComment.
     * @author 80374787 刘斌
     * @param {{
     *      subjectId:number, // 关联的主题id
     *      subjectType:string, // 关联的主题类型
     *      wrapper-selector:string, // 整个评论区域的包装元素选择器，需要是一个id
     *      canAddComment:boolean, // 是否显示添加评论区域
     *      pageSize?：number // 可选的每页展示评论数，默认为3
     *      cbAfterDisplayList? (currentList:any[])=>void //  成功展示列表后的回调函数
     *      cbAfterAddComment? ()=>void // 成功添加回复后的回调
     * }} options 配置项
     * @memberof CrmComment
     */
    function CrmComment(options) {
        _classCallCheck(this, CrmComment);

        this.options = $.extend({}, options);
        this.PAGE_SIZE = this.options.pageSize || 3; // 每页条数
        this.startIndex = 0; // 当前起点
        this.currentList = []; // 当前列表数据
        this.totalCount = 0; // 后台数据总数
        this.comment2Reply = {}; // 记录回复的目标评论相关信息
        this.isOwnComment = true; // 是否想自己独立发送一条评论

        this.initCommentList(); // 初始化列表
    }

    _createClass(CrmComment, [{
        key: "initCommentList",


        /**
         * 初始化/获取第一页评论列表
         *
         * @author 80374787 刘斌
         * @memberof CrmComment
         */
        value: function initCommentList() {
            this.startIndex = 0;
            this.getListHelper(this.startIndex, this.PAGE_SIZE, function (oldList, newList) {
                return newList;
            });
        }
    }, {
        key: "getNextPageCommentList",

        /**
         * 获取下一页列表数据
         *
         * @author 80374787 刘斌
         * @memberof CrmComment
         */
        value: function getNextPageCommentList() {
            if (!this.isThereMoreData) {
                return;
            }
            this.getListHelper(this.startIndex, this.PAGE_SIZE, function (oldList, newList) {
                return [].concat(_toConsumableArray(oldList), _toConsumableArray(newList));
            });
        }
    }, {
        key: "refreshCommentList",


        /**
         * 刷新列表
         *
         * @author 80374787 刘斌
         * @param {number} tempPageSize 在某些情况下刷新时，可能需要临时展示很多条数据，之后又恢复正常。 利用此可选参数
         * @memberof CrmComment
         */
        value: function refreshCommentList(tempPageSize) {
            tempPageSize = tempPageSize || this.PAGE_SIZE;
            this.startIndex = 0;
            this.getListHelper(this.startIndex, tempPageSize, function (oldList, newList) {
                return newList;
            });
        }
    }, {
        key: "getListHelper",


        /**
         * 获取列表的帮助函数。
         * 初始化、刷新、加载下一页的大部分逻辑是相同的，只有startIndex, pageSize，获取列表后的操作不一样
         *
         * @author 80374787 刘斌
         * @param {any} startIndex
         * @param {any} pageSize
         * @param {(oldList:any[],newList:any[])=>any[]} listHandler 获取到新列表后的操作，参数是以前的老列表和新拿到的后台列表
         * @memberof CrmComment
         */
        value: function getListHelper(startIndex, pageSize, listHandler) {
            var _this = this;

            // 参数准备
            var param = {
                X1: [{
                    busId: this.options.subjectId,
                    sbjTyp: this.options.subjectType
                }],
                X2: [{
                    startIndex: startIndex,
                    pageSize: pageSize
                }]
            };

            var prcCode = CrmComment.PRCCODES().GET_COMMENT_LIST;
            var prcCodeSuffix = prcCode.slice(4);

            this.renderSkeleton(); // 先加载骨架屏

            TaskManageUtils.commonFetchData(CrmComment.PATH(), prcCode, param, function (response) {
                var newList = CrmComment.mapListKeys(response.INFBDY[prcCodeSuffix + 'Z1']); // 新获取的列表
                _this.currentList = listHandler(_this.currentList, newList); // 通过一些操作，最终确定currentList
                _this.totalCount = response.INFBDY[prcCodeSuffix + 'Z2'][0].totalCount; // 总条数
                _this.startIndex = _this.startIndex + newList.length; // 更新起始序号
                _this.render(); // 渲染
            });
        }

        /**
         * 添加评论
         *
         * 评论成功后，需要有一些后续处理
         * 1. 如果是在列表中，可能需要更新显示的评论数
         * 2. 更新iframe高度
         * 3. 刷新评论列表，细节之处
         *      1. 如果是独立的评论，那么刷新后此评论应该位于最上面
         *      2. 如果是回复别人的评论，且此评论位于很下面，那么默认刷新策略会看不到我回复的评论
         *
         * @author 80374787 刘斌
         * @memberof CrmComment
         */

    }, {
        key: "addComment",
        value: function addComment(content) {
            var _this2 = this;

            var dataX1 = {
                busId: this.options.subjectId,
                sbjTyp: this.options.subjectType,
                cmtCncnt: content.slice(0, 500),
                cmtId: ""
            };
            if (!this.isOwnComment) {
                // 如果是回复别人的评论
                dataX1 = $.extend(dataX1, {
                    cmtTgtUsrId: this.comment2Reply.userId,
                    // cmtTgtPrnId: this.comment2Reply.parentId,
                    cmtId: this.comment2Reply.id
                });
            }

            TaskManageUtils.commonFetchData(CrmComment.PATH(), CrmComment.PRCCODES().ADD_COMMENT, {
                X1: [dataX1]
            }, function (response) {
                _this2.textAreaRowsAdded = false;
                _this2.isOwnComment = true;
                _this2.comment2Reply = {};
                $(_this2.commentInputSelector).val(""); // 清空input框

                _this2.refreshCommentList(_this2.startIndex + 1); // 刷新列表，获取的数据条数为当前已有的数据+1

                var cbAfterAddComment = _this2.options.cbAfterAddComment; // 成功添加回复后的回调
                if (cbAfterAddComment && typeof cbAfterAddComment === "function") {
                    cbAfterAddComment();
                }
            });
        }
    }, {
        key: "renderSkeleton",


        /**
         * 渲染骨架屏
         *
         * @author 80374787 刘斌
         * @memberof CrmComment
         */
        value: function renderSkeleton() {
            var skeletonHtml = "\n            <div class=\"back-color-f8f clearfix padding10 \">\n                <div class=\"comment-list margin-bottom10 \">\n                    <table  style=\"border-spacing: 0;\">\n                        <tbody>\n                            <tr class=\"comment-row cursor-pointer \">\n                                <td style=\"min-width: 100px;\"><span class=\"skeleton\"></span></td>\n                                <td style=\"width: 100%;\"><span class=\"skeleton\"></span></td>\n                                <td style=\"min-width: 89px;\"><span class=\"skeleton\"></span></td>\n                            </tr>\n                        </tbody>\n                    </table>\n                </div>";
            if (this.options.canAddComment) {
                skeletonHtml += "\n                <form class=\"add-comment\">\n                    <span class=\"skeleton fll\" style=\"width:calc(100% - 102px);margin-right:30px;height:30px;\"></span>\n                    <span class=\"skeleton flr\" style=\"width: 69px;height: 30px;\"></span>\n                </form>";
            }
            skeletonHtml += "</div>";

            $(this.wrapperSelector).html(skeletonHtml);
        }

        /**
         * 渲染评论区域
         *
         * @author 80374787 刘斌
         * @memberof CrmComment
         */

    }, {
        key: "render",
        value: function render() {
            var totalHtml = this.getPrefixTemplate();
            totalHtml += this.getCommentListTemplate();
            totalHtml += this.getLoadMoreTemplate();
            totalHtml += this.getAddCommentTemplate();
            totalHtml += this.getSuffixTemplate();

            $(this.wrapperSelector).html(totalHtml);
            this.bindEventHandler(); // 绑定DOM事件处理函数

            var cbAfterDisplayList = this.options.cbAfterDisplayList; // 成功展示列表后的回调函数
            if (cbAfterDisplayList && typeof cbAfterDisplayList === "function") {
                cbAfterDisplayList(this.currentList);
            }
        }
    }, {
        key: "getPrefixTemplate",


        /**
         * 前缀模板
         *
         * @author 80374787 刘斌
         * @returns
         * @memberof CrmComment
         */
        value: function getPrefixTemplate() {
            var hide = !this.options.canAddComment && this.totalCount === 0; // 是否隐藏整个评论区域

            return "\n            <div class='back-color-f8f clearfix " + (!hide ? " padding10 margin-top10 " : "") + "'>\n        ";
        }
    }, {
        key: "getCommentListTemplate",


        /**
         * 获取渲染评论列表模板
         *
         * @author 80374787 刘斌
         * @returns 评论列表模板
         * @memberof CrmComment
         */
        value: function getCommentListTemplate() {
            var _this3 = this;

            var html = "<div class=\"comment-list container  margin-bottom10 " + (this.totalCount === 0 ? " hide " : "") + "\">";

            this.currentList.forEach(function (comment, index) {
                html += _this3.getCommentTemplate(comment, index);
            });

            html += "</div>";
            return html;
        }
    }, {
        key: "getCommentTemplate",


        /**
         * 获取单条评论模板. 评论保留换行
         *
         * @author 80374787 刘斌
         * @param {any} comment
         * @returns 单条评论模板
         * @memberof CrmComment
         */
        value: function getCommentTemplate(comment, index) {
            var html = "\n            <table>\n                <tr  class=\"comment-row f12 " + (this.options.canAddComment ? " cursor-pointer " : "") + "\">\n                    <td valign=\"top\">\n                        <span style=\"display:none;\">\n                            <span class=\"comment-id\">" + comment.id + "</span>\n                            <span class=\"parent-comment-id\">" + comment.parentId + "</span>\n                        </span>\n                         <!-- \u7B2C\u4E00\u6761\u8BC4\u8BBA\u5DE6\u8FB9\u663E\u793A\u6C14\u6CE1 -->\n                        <span class=\"name-area nowrap fll " + (index === 0 ? " comment-bubble " : " ") + "  padding-right5\">\n                                <span class=\"name\" title=\"" + comment.userId + "\">" + comment.userName + "</span>";
            // 可选的回复目标
            if (comment.targetUserId || comment.targetUserName) {
                html += "           <em class=\"color-999 padding06\">\u56DE\u590D</em>\n                                <span class=\"name\" title=\"" + comment.targetUserId + "\">" + comment.targetUserName + "</span>";
            }

            html += "               <em class=\"color-999\"> : </em>\n                        </span>\n                    </td>\n                    <td  class=\"content color-999\">" + TaskManageUtils.transformHtml(comment.content) + "</td>\n                    <td  valign=\"top\" class=\"date nowrap color-999\">" + moment(comment.date).format("MM-DD HH:mm") + "</td>\n                </tr>\n            </table>\n        ";

            return html;
        }
    }, {
        key: "getLoadMoreTemplate",


        /**
         * 获取加载更多区域模板
         *
         * @author 80374787 刘斌
         * @returns 加载更多区域模板
         * @memberof CrmComment
         */
        value: function getLoadMoreTemplate() {
            if (this.isThereMoreData) {
                return "\n                <div class=\"load-more-tip margin-bottom10 padding-left25 f12 color-999\">\u663E\u793A\u540E\u9762" + this.PAGE_SIZE + "\u9879</div>\n            ";
            }
            return "";
        }
    }, {
        key: "getAddCommentTemplate",


        /**
         * 获取添加评论区域模板
         *
         * @author 80374787 刘斌
         * @returns 添加评论模板
         * @memberof CrmComment
         */
        value: function getAddCommentTemplate() {
            if (this.options.canAddComment) {
                return "\n            <form class=\"add-comment\">\n                <textarea class=\"fll\" id=\"comment-input\" maxlength=\"500\" placeholder=\"\u8BC4\u8BBA\u3002 \u63D0\u793A\uFF1A\u4F7F\u7528Ctrl+Enter\u6216\u8005Shift+Enter\u5747\u53EF\u76F4\u63A5\u53D1\u9001~\" rows=\"1\" wrap=\"virtual\"></textarea>\n                <button id=\"add-comment-btn\" class=\"btn btn-default flr\" type=\"button\" type=\"button\">\u53D1\u9001</button>\n            </form>";
            }
            return "";
        }
    }, {
        key: "getSuffixTemplate",


        /**
         * 后缀模板
         *
         * @author 80374787 刘斌
         * @returns
         * @memberof CrmComment
         */
        value: function getSuffixTemplate() {
            return "\n            </div>\n        ";
        }
    }, {
        key: "bindEventHandler",


        /**
         * 绑定DOM事件处理函数
         *
         * @author 80374787 刘斌
         * @memberof CrmComment
         */
        value: function bindEventHandler() {
            this.bindCommentClickHandler();
            this.bindLoadMoreClickHandler();
            this.bindAddCommentClickHandler();
            this.bindInputChangeHandler();
            this.bindInputKeyPressHandler();
            this.bindTextAreaClickHandler();
            this.bindWrapperEventHandler();
        }
    }, {
        key: "bindWrapperEventHandler",

        /**
         * 所有冒泡到wrapper的事件
         *
         * @author 80374787 刘斌
         * @memberof CrmComment
         */
        value: function bindWrapperEventHandler() {
            var _this4 = this;

            $(this.wrapperSelector).click(function (e) {
                e.stopPropagation(); // 阻止所有点击事件冒泡到外部

                // 点击其他区域时， 如果输入框中还没有手动输入内容， 将其变回一行
                if (_this4.textAreaRowsAdded) {
                    var content = $(_this4.commentInputSelector).val(); // 评论内容
                    if (!_this4.isOwnComment) {
                        // 如果是回复他人，评论内容需要去掉前缀
                        content = content.slice(_this4.autoInputText.length);
                    }
                    if (!content || content === "") {
                        _this4.textAreaRowsAdded = false;
                        $(_this4.commentInputSelector).attr("rows", 1);
                    }
                }
            });
        }

        /**
         * 绑定单条评论项点击事件。
         *
         * 界面中只有一个input，要同时支持回复他人和自己独立发布评论，有困难：
         * 1. 当用户a时刻点击评论想回复，在b时刻又不想回复它，而是想自己写一条。此时没有办法清除comment2Reply
         * 2. 如果把“回复XXX”当做真正的文字放到input中，那么如何分清“回复XXX”是用户自己敲进去的，还是代码放进去的？
         *
         * 思路： 设置一个表明是否想自己独立发送评论flag，初始为true。
         * 点击评论时，把“回复XXX”当做真正的文字放到input中，flag置为false
         * 当第一次input的文字少于“回复xxx”时，同时flag为false，把flag置为true，
         * 之后再也没有办法改变flag， 同时清除 comment2Reply。
         * 真正发送回复时，只有flag为false，才去拿comment2Reply，发送成功后清除comment2Reply
         *
         * @author 80374787 刘斌
         * @memberof CrmComment
         */

    }, {
        key: "bindCommentClickHandler",
        value: function bindCommentClickHandler() {
            if (!this.options.canAddComment) {
                // 如果不能评论，那么点击了其他评论什么也不做
                return;
            }

            var that = this;
            $(this.commentListSelector).click(function (e) {
                var parents = $(e.target).parents(".comment-row"); // 找到具有指定选择器的父元素

                if (parents.length === 0) {
                    // 如果不是点击在某条评论内部的区域，什么也不做
                    return;
                }

                var commentRow = parents; // 因为每次只会在某一条评论中点击，所以只会有一个值
                that.comment2Reply.id = +commentRow.find(".comment-id").html(); // 评论id
                that.comment2Reply.parentId = +commentRow.find(".parent-comment-id").html(); // 父评论id
                that.comment2Reply.userId = commentRow.find(".name").attr("title"); // 发表此评论的用户id
                that.comment2Reply.userName = commentRow.find(".name").html(); // 发表此评论的用户名

                that.isOwnComment = false; // 标志着想回复别人

                var input$ = $(that.commentInputSelector);

                input$.val(that.autoInputText).focus(); // ios的safari上支持不好
                // that.setInputCursorPosition(input$[0], -1); // 使用textarea在获得焦点时光标自动在最后，不使用此函数了
            });
        }
    }, {
        key: "setInputCursorPosition",

        /**
         * 设置input中光标的位置
         *
         * @author 80374787 刘斌
         * @param {HTMLInputElement} inputElement dom对象
         * @param {number} position 若想光标放在最后，设置为-1
         * @memberof CrmComment
         */
        value: function setInputCursorPosition(inputElement, position) {
            var length = inputElement.value.length;
            if (position < 0) {
                position = length;
            }
            if (inputElement.setSelectionRange) {
                inputElement.setSelectionRange(position, position);
            } else if (inputElement.createTextRange) {
                // IE
                var range = inputElement.createTextRange();
                range.move("character", position);
                range.select();
            }
        }

        /**
         * 绑定文本框输入事件。
         *
         * @author 80374787 刘斌
         * @memberof CrmComment
         */

    }, {
        key: "bindInputChangeHandler",
        value: function bindInputChangeHandler() {
            var that = this;
            /**
             * 当第一次input的文字少于“回复 xxx”时，同时isOwnComment为false，
             * 此时判定用户想自己发评论，而不是回复他人。
             * 把isOwnComment置为true，之后再也没有办法改变isOwnComment， 同时清除 comment2Reply。
             */
            $(this.commentInputSelector).on("input", function () {
                if (!that.isOwnComment && $(this).val().length < that.autoInputText.length) {
                    $(this).val(""); // 直接清空整个输入框，这样用户就能理解现在不是在回复他人
                    that.isOwnComment = true;
                    that.comment2Reply = {};
                }
            });
        }
    }, {
        key: "bindInputKeyPressHandler",


        /**
         * 为了更好的用户体验，使用组合键快捷发送
         *
         * @author 80374787 刘斌
         * @memberof CrmComment
         */
        value: function bindInputKeyPressHandler() {
            var _this5 = this;

            // 搜索框输入enter键自动搜索
            $(this.commentInputSelector).keypress(function (e) {
                var code = e.charCode || e.keyCode; // firefox使用charcode
                if (code === 10 && e.ctrlKey || // ctrl+ enter,使用此组合时enter等于10
                code === 13 && e.shiftKey // shift + enter,使用此组合时enter等于13
                ) {
                        $(_this5.addCommentBtnSelector).trigger("click"); // 触发发送
                    }
            });
        }

        /**
         * 绑定评论输入框点击事件
         *
         * @author 80374787 刘斌
         * @memberof CrmComment
         */

    }, {
        key: "bindTextAreaClickHandler",
        value: function bindTextAreaClickHandler() {
            var that = this;
            // 在第一次点击textarea时，将其变大一些；
            $(this.commentInputSelector).click(function (e) {
                e.stopPropagation();
                if (!that.textAreaRowsAdded) {
                    that.textAreaRowsAdded = true;
                    $(this).attr("rows", 3);
                }
            });
        }
    }, {
        key: "bindLoadMoreClickHandler",


        /**
         * 绑定“加载更多”的点击事件
         *
         * @author 80374787 刘斌
         * @memberof CrmComment
         */
        value: function bindLoadMoreClickHandler() {
            var _this6 = this;

            // 加载下一页
            $(this.loadMoreSelector).click(function () {
                return _this6.getNextPageCommentList();
            });
        }
    }, {
        key: "bindAddCommentClickHandler",

        /**
         * 绑定添加评论按钮点击事件,TODO 是否需要debounceTime（利用lodash或rxjs）
         *
         * @author 80374787 刘斌
         * @memberof CrmComment
         */
        value: function bindAddCommentClickHandler() {
            var that = this;
            $(this.addCommentBtnSelector).click(function () {
                var content = $(that.commentInputSelector).val(); // 评论内容

                if (!that.isOwnComment) {
                    // 如果是回复他人，评论内容需要去掉前缀
                    content = content.slice(that.autoInputText.length);
                }

                if (!content || content.trim() === "") {
                    // 不允许发空的内容
                    return;
                }

                that.addComment(content);
            });
        }
    }, {
        key: "wrapperSelector",
        get: function get() {
            return this.options["wrapper-selector"];
        }
    }, {
        key: "commentListSelector",
        get: function get() {
            return this.wrapperSelector + " .comment-list";
        }
    }, {
        key: "commentInputSelector",
        get: function get() {
            return this.wrapperSelector + " #comment-input";
        }
    }, {
        key: "addCommentBtnSelector",
        get: function get() {
            return this.wrapperSelector + " #add-comment-btn";
        }
    }, {
        key: "loadMoreSelector",
        get: function get() {
            return this.wrapperSelector + " .load-more-tip";
        }
    }, {
        key: "autoInputText",


        /**
         * 获取在评论框中自动添加的文本.
         * 1. 如果是自己独立的评论，输入框中不会自动添加任何文本
         * 2. 如果是回复他人的评论，输入框中会自动添加“回复 XXX:”
         *
         * @readonly
         * @memberof CrmComment
         */
        get: function get() {
            var text = "";
            if (!this.isOwnComment && this.comment2Reply.userName) {
                text = "\u56DE\u590D " + this.comment2Reply.userName + ":";
            }
            return text;
        }
    }, {
        key: "isThereMoreData",


        /**
         * 是否还有更多数据
         *
         * @readonly
         * @return \{{{boolean}}\} {{是否还有更多数据}}
         * @memberof CrmComment
         */
        get: function get() {
            if (this.startIndex >= this.totalCount) {
                return false;
            }
            return true;
        }
    }], [{
        key: "PRCCODES",
        value: function PRCCODES() {
            return {
                GET_COMMENT_LIST: "AS01GETSUBJECTCOMMENTLIST", // 获取评论列表
                ADD_COMMENT: "AS01INSERTSUBJECTCOMMENT", // 添加评论
                GET_COMMENT_COUNT_BY_ID: "AS01GETSUBJECTCOMMENTCOUNT", // 根据主题id获取评论数
                GET_COMMENT_COUNT_LIST: "" // 获取一组主题的评论数组成的列表
            };
        }
    }, {
        key: "PATH",

        /**
         * nginx代理路径
         *
         * @readonly
         * @memberof CrmComment
         */
        value: function PATH() {
            return "ccrmSocialChat";
        }
    }, {
        key: "SUBJECT_TYPE",

        /**
         * 任务类型
         *
         * @author 80374787 刘斌
         * @static
         * @returns 类型常量对象
         * @memberof CrmComment
         */
        value: function SUBJECT_TYPE() {
            return {
                "COMMON_TASK": "01",
                "BUSINESS_APPLY": "02"
            };
        }
    }, {
        key: "DEST_KEYS",
        value: function DEST_KEYS() {
            return ["id", "parentId", "userId", "userName", "targetUserId", "targetUserName", "date", "content"];
        }
    }, {
        key: "ORIGIN_KEYS",
        value: function ORIGIN_KEYS() {
            return ["cmtId", "prnCmtId", "cmtUsrId", "cmtUsrNm", "cmtTgtUsrId", "cmtTgtUsrNm", "cmtTm", "cmtCncnt"];
        }
    }, {
        key: "mapListKeys",

        /**
         *
         *
         * @author 80374787 刘斌
         * @static
         * @param {any[]} originList
         * @memberof CrmComment
         */
        value: function mapListKeys(originList) {
            return originList.filter(function (originObj) {
                return Object.keys(originObj).length > 0;
            }) // 过滤掉空对象
            .map(function (originObj) {
                return TaskManageUtils.mapKeys(originObj, CrmComment.ORIGIN_KEYS(), CrmComment.DEST_KEYS());
            });
        }
    }, {
        key: "getCommentCountById",


        /**
         * 获取主题对应的评论数
         *
         * @author 80374787 刘斌
         * @static
         * @param {any} subjectId 主题id
         * @param {any} subjectType 主题类型
         * @param {any} callback 成功拿到评论数后的回调函数
         * @memberof CrmComment
         */
        value: function getCommentCountById(subjectId, subjectType, callback) {
            var param = {
                X1: [{
                    busId: subjectId,
                    sbjTyp: subjectType
                }]
            };

            var prcCode = CrmComment.PRCCODES().GET_COMMENT_COUNT_BY_ID;
            var prcCodeSuffix = prcCode.slice(4);

            TaskManageUtils.commonFetchData(CrmComment.PATH(), prcCode, param, function (response) {
                var count = response.INFBDY[prcCodeSuffix + 'Z1'][0]["subjectCommentCount"];
                callback && callback(count);
            });
        }
    }]);

    return CrmComment;
}();

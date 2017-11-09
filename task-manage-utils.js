var TaskManageUtils = (function() {

    /**
     * 替换字符串中的特殊换行字符 $#B$R#$
     * 此字符串是手机端页面转译存储到数据库中的
     *
     * @param {any} str 待替换字符串
     * @returns 替换后字符串
     */
    function replaceLineCharacter(str) {
        return str.split("$#B$R#$").join(" ");
    }

    /**
     * 过滤字符串中的html特殊字符，防止XSS攻击
     *
     * @param {any} str 待过滤字符串
     * @returns 过滤后的字符串
     */
    function transformHtmlCharactor(str) {
        if (str && str.trim()) {
            return str.trim().replace(/</g, "&lt;").replace(/>/g, "&gt;");
        } else {
            return "";
        }

    }
    /** 过滤字符串中的html特殊字符，防止XSS攻击及换行符替换
     *  @param {any} str 待过滤字符串
     *  @returns 过滤后的字符串
     */
    function transformHtml(str) {
        if (str && str.trim()) {
            return str.trim()
                .replace(/</g, "&lt;") // <
                .replace(/>/g, "&gt;") // >
                .replace(/\n|\r\n/g, "<br/>") // 换行
                .replace(/\$#B\$R#\$/g, "<br/>")
                .replace(/\t/g, "&emsp;") // 制表符
                .replace(/\s/g, "&nbsp;"); // 空格,\s也匹配\t，故注意顺序
        } else {
            return "";
        }
    }
    /**
     * 多种过滤转换方法的组合
     *
     * @param {any} str 待过滤字符串
     * @returns  过滤后的字符串
     */
    function replaceOperationGroup(str) {
        return transformHtmlCharactor(replaceLineCharacter(str));
    }

    /**
     * 获取url中的文件名。
     * url："http://localhost:5565/proposed-task/proposed-task.html"
     * 文件名：proposed-task
     *
     * @returns url中的文件名
     */
    function getUrlFileName() {
        var href = window.location.href;
        var wholeFileName = href.split("/").slice(-1)[0]; // 完整的文件名，proposed-task.html
        var fileName = wholeFileName.split(".")[0]; // 文件名，如proposed-task
        return fileName;
    }

    /**
     * 调整rightiframe的高度。
     * 在改变iframe中内容的高度时，iframe本身的高度不会自动调整，需要手动调整
     *
     * @param {number} totalHeightSurrounded
     */
    function changeIframeHeight(totalHeightSurrounded) {
        var clientH = top.document.documentElement.clientHeight - totalHeightSurrounded - 44;
        var ifm = parent.document.getElementById("rightframe"); // 这个rightframe如果写成变量，ifm就变成null？？？？
        var subweb = parent.document.frames ? parent.document.frames["rightframe"].document : ifm.contentDocument;
        if (ifm != null && subweb != null) {
            iheight = parseFloat(getComputedStyle(subweb.body).height) > clientH ? parseFloat(getComputedStyle(subweb.body).height) + 44 : clientH;
        }
        ifm.height = iheight;
        ifm.style.height = iheight + 'px';

        var topifm = top.document.getElementById('frame' + $('.tab-aselect', window.top.document).attr('data-name'));
        var topsubweb = top.document.frames ? top.document.frames[$(topifm).attr('name')].document : topifm.contentDocument;
        topifm.height = iheight + 40;
        topifm.style.height = iheight + 40 + 'px';
        $('#tab-content .tools .tools-left', window.parent.document).css('min-height', iheight + 'px');
    }

    /**
     * toast成功的消息，依赖jquery.toast库
     *
     * @param {string} message 消息内容
     * @param {string} title 标题
     */
    function toastSuccess(message, title) {
        $.toast({
            heading: title,
            text: message,
            loader: false,
            showHideTransition: 'fade', // It can be plain, fade or slide
            icon: "success",
            textColor: '#fff', // text color
            allowToastClose: true, // Show the close button or not
            hideAfter: 1200, // `false` to make it sticky or time in miliseconds to hide after
            stack: 5, // `fakse` to show one stack at a time count showing the number of toasts that can be shown at once
            textAlign: 'left', // Alignment of text i.e. left, right, center
            position: 'mid-center' // bottom-left or bottom-right or bottom-center or top-left or top-right or top-center or mid-center or an object representing the left, right, top, bottom values to position the toast on page
        });
    }

    /**
     * toast失败的消息，依赖jquery.toast库
     *
     * @param {string} message 消息内容
     * @param {string} title 标题
     */
    function toastError(error, title) {
        $.toast({
            heading: title,
            text: error,
            loader: false,
            showHideTransition: 'fade',
            icon: "error",
            textColor: '#fff',
            allowToastClose: true,
            hideAfter: 3000,
            stack: 5,
            textAlign: 'left',
            position: 'mid-center'
        });
    }

    /**
     * 通用的简单确认框
     *
     * @param {string} title 标题
     * @param {string} content 内容
     * @param {Function} confirmCallback  点击确认时执行的回调函数
     */
    function commonConfirmDialog(title, content, confirmCallback) {
        var confirmDialog = top.dialog({
            title: title,
            id: "crm-common-confirm-dialog",
            content: "<div class='userconfirm'><i></i><span>" +
                content +
                "</span></div>",
            onclose: function() {
                confirmDialog.close();
                confirmDialog.remove();
            },
            button: [{
                    value: '确定',
                    callback: confirmCallback,
                },
                {
                    value: '取消',
                    callback: function() {
                        confirmDialog.close();
                        confirmDialog.remove();
                    }
                },
            ]
        }).showModal();
    }
    /**
     * 操作成功简单提示弹框
     *
     * @param {string} title
     * @param {string} content
     */
    function operateSuccessDialog(title, content) {
        var successDialog = top.dialog({
            title: title,
            id: "crm-operate-success-dialog",
            content: "<div class='successOperateConfirm'><i class=''></i><span>" +
                content +
                "</span></div>",
            onclose: function() {
                successDialog.close();
                successDialog.remove();
            },
            button: [{
                value: '关闭',
                callback: function() {
                    successDialog.close();
                    successDialog.remove();
                }
            }]
        }).showModal();
    }
    /**
     * 通用的只含有单个Textarea的弹窗
     *
     * @param {object} options 含有
     * title 可选，默认为“提示”
     * label 必选，textarea旁边的提示
     * width 可选，默认620px
     * height 可选，默认210px
     * placeholder 可选，textarea里面的占位符提示
     * maxlength: 最长输入多少字,默认100
     * btnCallbackList 底部操作按钮列表，每个按钮包含
     *      text  按钮文字
     *      callback 可选的点击的回调函数，默认为关闭弹窗
     */
    function commonTextAreaDialog(options) {
        options = options || {};
        options.btnCallbackList = options.btnCallbackList || [];

        var config = {
            title: options.title || "提示",
            id: "textAreaDialog",
            width: options.width || '620px',
            height: options.height || '210px',
            data: options,
            url: '/business/page/task-manage/shared/common-textarea-dialog/common-textarea-dialog.html',
            onclose: function() {
                textAreaDialog.close();
                textAreaDialog.remove();
            },
            button: []
        };
        // 添加弹窗按钮
        for (var i = 0; i < options.btnCallbackList.length; i++) {
            var btn = options.btnCallbackList[i];
            (function(btn) {
                config.button.push({
                    value: btn.text,
                    callback: function() {
                        if (!btn.callback) { // 若不提供回调，默认关闭弹窗
                            textAreaDialog.close();
                            textAreaDialog.remove();
                            return;
                        }
                        var content = $(this.iframeNode.contentDocument).find('.dialog-common-textarea textarea').val();

                        textAreaDialog.close();
                        textAreaDialog.remove();
                        btn.callback(content); // 将textarea中的内容传给用户指定的回调
                    }
                });
            })(btn);
        }
        var textAreaDialog = top.dialog(config).showModal();
    }


    /**
     * 通用的后台请求函数，封装了通用的逻辑，使调用者更方便
     *
     * @param {any} path
     * @param {any} prcCode
     * @param {any} dataParam 数据参数
     * @param {any} successCb 成功的回调
     */
    function commonFetchData(path, prcCode, dataParam, successCb) {
        ccrmUtil.dataPost(path, prcCode, dataParam, function(response) {
            if (response.ERRMSG == "" || response.ERRMSG == null) { // 成功
                successCb(response);
            } else {
                ccrmUtil.errorMessage(response.ERRMSG); // 统一的报错方式
            }
        });
    }

    /**
     * 根据键名映射规则，修改对象的键名
     * 如  z01 -> prmkey
     * 	   z02 -> date
     *     z03 -> custid
     * 原始对象的结构为
     * {
     *    z01:'value1',
     *    z02:'value2',
     *    z03:'value3'
     * }
     * 转换后:
     *  {
     *    prmkey:'value1',
     *    date:'value2',
     *    custid:'value3'
     * }
     * 所有转换前的键名放置在origKeys数组中，origKeys=["z01","z02","z03"];
     * 需要转换成的键名放置在destKeys数组中，destKeys=["prmkey","date","custid"];
     *
     * origKeys必须与destKeys互相对应
     * PS:为了方便，贴10个，["Z01","Z02","Z03","Z04","Z05","Z06","Z07","Z08","Z09","Z10"];
     */
    function mapKeys(origObject, origKeys, destKeys) {
        var i = 0;
        var mappedObject = {};
        if (!origObject) { // null或undifine时直接返回空对象
            return mappedObject;
        }
        for (; i < origKeys.length; i++) {
            mappedObject[destKeys[i]] = origObject[origKeys[i]];
        }
        return mappedObject;
    }

    return {
        replaceLineCharacter: replaceLineCharacter,
        transformHtmlCharactor: transformHtmlCharactor,
        transformHtml: transformHtml,
        replaceOperationGroup: replaceOperationGroup,
        getUrlFileName: getUrlFileName,
        changeIframeHeight: changeIframeHeight,
        toastSuccess: toastSuccess,
        toastError: toastError,
        commonConfirmDialog: commonConfirmDialog,
        commonTextAreaDialog: commonTextAreaDialog,
        commonFetchData: commonFetchData,
        operateSuccessDialog: operateSuccessDialog,
        mapKeys: mapKeys,
    }
})();
window.onload = function() {
    const crmComment = new CrmComment({
        subjectId: 123,
        "wrapper-selector": "#test-comment-warpper",
        canAddComment: true,
        cbAfterDisplayList: (list) => console.log(list.length),
        cbAfterAddComment: () => console.log(`评论数加1`),
    });
};
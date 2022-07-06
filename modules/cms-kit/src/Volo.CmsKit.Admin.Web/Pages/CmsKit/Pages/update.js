$(function () {

    var l = abp.localization.getResource("CmsKit");

    var $formUpdate = $('#form-page-update');
    var $buttonSubmit = $('#button-page-update');
    var widgetModal = new abp.ModalManager({ viewUrl: abp.appPath + "CmsKit/Contents/AddWidgetModal", modalClass: "addWidgetModal" });

    $formUpdate.data('validator').settings.ignore = ":hidden, [contenteditable='true']:not([name]), .tui-popup-wrapper";

    var scriptEditor = CodeMirror.fromTextArea(document.getElementById("ViewModel_Script"), {
        mode: "javascript",
        lineNumbers: true
    });

    var styleEditor = CodeMirror.fromTextArea(document.getElementById("ViewModel_Style"), {
        mode: "css",
        lineNumbers: true
    });

    $('.nav-tabs a').on('shown.bs.tab', function () {
        scriptEditor.refresh();
        styleEditor.refresh();
    });

    $formUpdate.on('submit', function (e) {
        e.preventDefault();

        if ($formUpdate.valid()) {

            abp.ui.setBusy();

            $("#ViewModel_Style").val(styleEditor.getValue());
            $("#ViewModel_Script").val(scriptEditor.getValue());

            $formUpdate.ajaxSubmit({
                success: function (result) {
                    abp.notify.success(l('SuccessfullySaved'));
                    abp.ui.clearBusy();
                    location.href = "../../Pages";
                }
            });
        }
    });

    $buttonSubmit.click(function (e) {
        e.preventDefault();
        $formUpdate.submit();
    });

    // -----------------------------------
    function getUppyHeaders() {
        var headers = {};
        headers[abp.security.antiForgery.tokenHeaderName] = abp.security.antiForgery.getToken();

        return headers;
    }

    var fileUploadUri = "/api/cms-kit-admin/media/page";
    var fileUriPrefix = "/api/cms-kit/media/";

    initAllEditors();

    function initAllEditors() {
        $('.content-editor').each(function (i, item) {
            initEditor(item);
        });
    }

    function initEditor(element) {
        var $editorContainer = $(element);
        var inputName = $editorContainer.data('input-id');
        var $editorInput = $('#' + inputName);
        var initialValue = $editorInput.val();

        var editor = new toastui.Editor({
            el: $editorContainer[0],
            usageStatistics: false,
            useCommandShortcut: true,
            initialValue: initialValue,
            previewStyle: 'tab',
            plugins: [toastui.Editor.plugin.codeSyntaxHighlight],
            height: "100%",
            minHeight: "25em",
            initialEditType: 'markdown',
            language: $editorContainer.data("language"),
            toolbarItems: [
                ['heading', 'bold', 'italic', 'strike'],
                ['hr', 'quote'],
                ['ul', 'ol', 'task', 'indent', 'outdent'],
                ['table', 'image', 'link'],
                ['code', 'codeblock'],
                // Using Option: Customize the last button
                [{
                    el: createAddWidgetButton(),
                    command: 'bold',
                    tooltip: 'Add Widget'
                }]
            ],
            hooks: {
                addImageBlobHook: uploadFile,
            },
            events: {
                change: function (_val) {
                    $editorInput.val(editor.getMarkdown());
                    $editorInput.trigger("change");
                }
            }
        });
    }

    function uploadFile(blob, callback, source) {
        var UPPY_OPTIONS = {
            endpoint: fileUploadUri,
            formData: true,
            fieldName: "file",
            method: "post",
            headers: getUppyHeaders()
        };

        var UPPY = Uppy.Core().use(Uppy.XHRUpload, UPPY_OPTIONS);

        UPPY.reset();

        UPPY.addFile({
            id: "content-file",
            name: blob.name,
            type: blob.type,
            data: blob,
        });

        UPPY.upload().then((result) => {
            if (result.failed.length > 0) {
                abp.message.error("File upload failed");
            } else {
                var mediaDto = result.successful[0].response.body;
                var fileUrl = (fileUriPrefix + mediaDto.id);

                callback(fileUrl, mediaDto.name);
            }
        });
    }

    function createAddWidgetButton() {
        const button = document.createElement('button');

        button.className = 'toastui-editor-toolbar-icons last dropdown';
        button.style.backgroundImage = 'none';
        button.style.margin = '0';
        button.innerHTML = `AW`;
        button.addEventListener('click', (event) => {
            event.preventDefault();
            widgetModal.open();
        });

        return button;
    }
});

/* globals render, renderError, EventHandler */
var State = {
    id: -1,
    preview_picture: 'img/wallabag-icon-128.png',
    title: 'Title',
    domain_name: 'Domain name',
    is_starred: 0,
    is_archived: 0,
    tagList: '',
    foundTagList: '',
    AllowSpaceInTags: false,
    tabUrl: '',
    Url: '',
    message: '',
    Debug: false
};

var Controller = {
    port: null,
    Connect: function () {
        this.port = browser.runtime.connect({ name: 'popup' });
        this.port.onMessage.addListener(Listener);
    },
    Save: function () { this.port.postMessage({ request: 'save' }); },
    patchArticle: function () { this.port.postMessage({request: 'patch', State: this.State}); },
    saveTitle: function (title) {
        this.State.title = title;
        render(this.State);
        this.patchArticle();
    },
    deleteArticle: function () {
        this.port.postMessage({ request: 'delete', articleId: this.State.id, tabUrl: this.State.tabUrl });
        window.close();
    },
    toggleStarred: function () {
        this.State.is_starred = (this.State.is_starred + 1) % 2;
        render(this.State);
        this.patchArticle();
    },
    toggleArchived: function () {
        this.State.is_archived = (this.State.is_archived + 1) % 2;
        render(this.State);
        this.patchArticle();
    },
    deleteTag: function () {},
    SetTags: function (value) {
        this.State.tagList = `${this.State.tagList},${value}`;
        this.patchArticle();
    },
    FindTags: function (value) {
        this.port.postMessage({ request: 'findtags', State: this.State, search: value });
    }
};

const Listener = (msg) => {
    try {
        switch (msg.response) {
            case 'error':
                renderError(msg.error.message);
                break;
            case 'state':
                Object.assign(State, msg.data);
                render(State);
                break;
            default:
                State.Debug && console.log(`unknown request ${JSON.stringify(msg)}`);
        }
    } catch (error) {
        renderError(error.message);
    }
};

document.addEventListener('DOMContentLoaded', function () {
    if (typeof (browser) === 'undefined' && typeof (chrome) === 'object') {
        browser = chrome;
    }
    Controller.Connect();
 //   render(State);
    EventHandler.init();
    Controller.Save();
});

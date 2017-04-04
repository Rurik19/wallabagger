let State = {
    id: -1,
    preview_picture: 'img/wallabag-icon-128.png',
    title: 'Title',
    domain_name: 'Domain name',
    is_starred: 0,
    is_archived: 0,
    tags: [],
    AllowSpaceInTags: false,
    tabUrl: '',
    Url: '',
    message: '',
    Debug: false,
    editMode: false
};

let port = null;

State = new Proxy(State, {
    set (target, prop, value) {
        if (target.Debug) console.log(`state set ${prop}: ${value}`);
        target[prop] = value;
        render(target);
        return true;
    }
});

const deleteTag = () => {};

const deleteArticle = () => {
    port.postMessage({ request: 'deleteArticle', articleId: State.id, tabUrl: State.tabUrl });
    window.close();
};

const openDeleteDialog = () => { document.getElementById('delete_confirmation').classList.add('active'); };
const closeDeleteDialog = () => { document.getElementById('delete_confirmation').classList.remove('active'); };

const toggleEdit = () => { State.editMode = !State.editMode; };

const saveEdit = () => {
    State.title = document.getElementById('title-input').value;
    port.postMessage({request: 'saveTitle', articleId: State.id, title: State.title, tabUrl: State.tabUrl});
    toggleEdit();
};

function toggleStarred (e) {
    State.is_starred = (State.is_starred + 1) % 2;
    port.postMessage({request: 'SaveStarred', articleId: State.id, value: State.is_starred, tabUrl: State.tabUrl});
}
function toggleArchived (e) {
    State.is_archived = (State.is_archived + 1) % 2;
    port.postMessage({request: 'SaveArchived', articleId: State.id, value: State.is_archived, tabUrl: State.tabUrl});
}

function messageListener (msg) {
    if (State.Debug) console.log(JSON.stringify(msg));
    switch (msg.response) {
        case 'state':
            Object.assign(State, msg.data);
            break;
        case 'error':
            renderError(msg.error.message);
            break;
        default:
            console.log(`unknown message: ${JSON.stringify(msg)}`);
    };
}

document.addEventListener('DOMContentLoaded', function () {
    if (typeof (browser) === 'undefined' && typeof (chrome) === 'object') {
        browser = chrome;
    }
    port = browser.runtime.connect({ name: 'popup' });
    port.onMessage.addListener(messageListener);
    port.postMessage({ request: 'save' });
});

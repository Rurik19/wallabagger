//* globals WallabagApi */

// declarations

if (typeof (browser) === 'undefined' && typeof (chrome) === 'object') {
    browser = chrome;
}

let Port = null;
let portConnected = false;

var CacheType = function (enable) {
    this.enabled = enable;
    this._cache = [];
};

CacheType.prototype = {
    _cache: null,
    enabled: null,

    str: function (some) {
        return btoa(JSON.stringify(some));
    },

    set: function (key, data) {
        if (this.enabled) {
            this._cache[this.str(key)] = data;
        }
    },

    clear: function (key) {
        if (this.enabled) {
            delete this._cache[this.str(key)];
        }
    },

    check: function (key) {
        return this.enabled && (this._cache[this.str(key)] !== undefined);
    },

    get: function (key) {
        return this.enabled ? this._cache[this.str(key)] : undefined;
    }
};

const icons = {
    'default': browser.runtime.getManifest().browser_action.default_icon,
    'good': 'img/wallabagger-green.svg',
    'wip': 'img/wallabagger-yellow.svg',
    'bad': 'img/wallabagger-red.svg'

};

const wallabagContextMenus = [
    {
        id: 'wallabagger-add-link',
        title: 'Wallabag it!',
        contexts: ['link', 'page']
    },
    {
        type: 'separator',
        contexts: ['browser_action']
    },
    {
        id: 'unread',
        title: 'Unread articles',
        contexts: ['browser_action']
    },
    {
        id: 'starred',
        title: 'Starred articles',
        contexts: ['browser_action']
    },
    {
        id: 'archive',
        title: 'Archived articles',
        contexts: ['browser_action']
    },
    {
        id: 'all',
        title: 'All articles',
        contexts: ['browser_action']
    },
    {
        id: 'tag',
        title: 'Tag list',
        contexts: ['browser_action']
    }
];

const existStates = {
    exists: 'exists',
    notexists: 'notexists',
    wip: 'wip'
};

const cache = new CacheType(true); // TODO - here checking option
const dirtyCache = new CacheType(true);
const existCache = new CacheType(true);

const api = new WallabagApi();

// Code

api.init().then(data => {
    addExistCheckListeners(api.data.AllowExistCheck);
    api.GetTags().then(tags => { cache.set('allTags', tags); });
});

addListeners();
createContextMenus();

// Functions
function createContextMenus () {
    wallabagContextMenus.map(menu => { browser.contextMenus.create(menu); });
}

function onTabActivatedListener (activeInfo) {
    setIcon(icons.default);
    const { tabId } = activeInfo;
    browser.tabs.get(tabId, function (tab) {
        checkExist(tab.url);
    });
}

function onTabCreatedListener (tab) {
    setIcon(icons.default);
}

function onTabUpdatedListener (tabId, changeInfo, tab) {
    if (changeInfo.status === 'loading' && tab.active) {
        saveExistFlag(tab.url, existStates.notexists);
        requestExists(tab.url);
    }
}

function addExistCheckListeners (enable) {
    if (enable) {
        browser.tabs.onActivated.addListener(onTabActivatedListener);
        browser.tabs.onCreated.addListener(onTabCreatedListener);
        browser.tabs.onUpdated.addListener(onTabUpdatedListener);
    } else {
        if (browser.tab && browser.tab.onActivated.hasListener(onTabActivatedListener)) {
            browser.tab.onActivated.removeListener(onTabActivatedListener);
        }
        if (browser.tab && browser.tabs.onCreated.hasListener(onTabCreatedListener)) {
            browser.tabs.onCreated.removeListener(onTabCreatedListener);
        }
        if (browser.tab && browser.tabs.onUpdated.hasListener(onTabUpdatedListener)) {
            browser.tabs.onUpdated.remoneListener(onTabUpdatedListener);
        }
    }
}

function onContextMenusClicked (info) {
    switch (info.menuItemId) {
        case 'wallabagger-add-link':
            if (info.linkUrl.length > 0) {
                savePageToWallabag(info.linkUrl, true);
            } else {
                savePageToWallabag(info.pageUrl, false);
            }
            break;
        case 'unread':
        case 'starred':
        case 'archive':
        case 'all':
        case 'tag':
            GotoWallabag(info.menuItemId);
            break;
    }
}

function onCommandsCommand (command) {
    if (command === 'wallabag-it') {
        browser.tabs.query({ 'active': true, 'currentWindow': true }, function (tabs) {
            if (tabs[0] != null) {
                savePageToWallabag(tabs[0].url, false);
            }
        });
    }
}

function postIfConnected (obj) {
    portConnected && Port.postMessage(obj);
    api.data.Debug && console.log(`postMessage: ${JSON.stringify(obj)}`);
}
function onPortMessage (msg) {
    if (api.data.Debug) console.log(JSON.stringify(msg));
    try {
        switch (msg.request) {
            case 'save':
                browser.tabs.query({ 'active': true, 'currentWindow': true }, function (tabs) {
                    if (tabs[0] != null) {
                        let tab = tabs[0];
                        postIfConnected({
                            response: 'state',
                            data: {
                                Debug: api.data.Debug,
                                tabUrl: tab.url,
                                title: tab.title,
                                domain_name: /(\w+:\/\/)([^/]+)\/(.*)/.exec(tab.url)[2]
                            }
                        });
                        savePageToWallabag(tabs[0].url);
                    }
                });
                break;
            case 'patch':
                if (msg.State.id > 0) {
                    api.PatchArticle(msg.State.id, { title: msg.State.title, starred: msg.State.is_starred, archive: msg.State.is_archived, tags: msg.State.tagList });
                } else {
                    dirtyCacheSet(msg.tabUrl, { title: msg.State.title, is_starred: msg.State.is_starred, is_archived: msg.State.is_archived, tagList: msg.State.tagList });
                }
                break;
            case 'findtags':
                findTags(msg.search, msg.State);
                break;
            case 'tags':
                if (!cache.check('allTags')) {
                    api.GetTags()
                            .then(data => {
                                postIfConnected({ response: 'tags', tags: data });
                                cache.set('allTags', data);
                            });
                } else {
                    postIfConnected({ response: 'tags', tags: cache.get('allTags') });
                }
                break;
            case 'delete':
                if (msg.articleId !== -1) {
                    api.DeleteArticle(msg.articleId).then(data => {
                        cache.clear(msg.tabUrl);
                    });
                } else {
                    dirtyCacheSet(msg.tabUrl, {deleted: true});
                }
                setIcon(icons.default);
                saveExistFlag(msg.tabUrl, existStates.notexists);
                break;
            case 'setup':
                postIfConnected({ response: 'state', data: api.data });
                break;
            case 'setup-save':
                api.setsave(msg.data);
                postIfConnected({ response: 'setup-save', data: api.data });
                addExistCheckListeners(msg.data.AllowExistCheck);
                break;
            case 'setup-gettoken':
                api.setsave(msg.data);
                api.GetAppToken()
                        .then(a => {
                            api.save();
                            postIfConnected({ response: 'setup-gettoken', data: api.data, result: true });
                            if (!cache.check('allTags')) {
                                api.GetTags()
                                .then(data => { cache.set('allTags', data); });
                            }
                        })
                        .catch(a => {
                            postIfConnected({ response: 'setup-gettoken', data: api.data, result: false });
                        });
                break;
            case 'setup-checkurl':
                api.setsave(msg.data);
                api.CheckUrl()
                        .then(a => {
                            postIfConnected({ response: 'setup-checkurl', data: api.data, result: true });
                        })
                        .catch(a => {
                            api.clear();
                            // api.save();
                            postIfConnected({ response: 'setup-checkurl', data: api.data, result: false });
                        });
                break;
            default: {
                console.log(`unknown request ${JSON.stringify(msg)}`);
            }
        }
    } catch (error) {
        setIcon(icons.bad);
        setTimeout(function () { setIcon(icons.default); }, 5000);
        postIfConnected({ response: 'error', error: error });
    }
}

function findTags (search, State) {
    if (!cache.check('allTags')) {
        const dirtyTagList = dirtyCache.check(State.tabUrl) ? dirtyCache.get(State.tabUrl).tagList : '';
        const allTags = cache.get('allTags');
        const articleTags = dirtyTagList === '' ? State.tagList.split(',') : `${State.tagList},${dirtyTagList}`.split(',');
        const foundTags = allTags.filter(tag => (articleTags.map(t => t.toUpperCase()).indexOf(tag.label.toUpperCase()) === -1) &&
            ((tag.label.toUpperCase().indexOf(search.toUpperCase()) !== -1) || (search.toUpperCase() === tag.label.toUpperCase()))
        ).join(',');
        postIfConnected({ response: 'state', State: { foundTagList: foundTags } });
    }
}

function onRuntimeConnect (port) {
    Port = port;
    portConnected = true;

    Port.onDisconnect.addListener(function () { portConnected = false; });
    Port.onMessage.addListener(onPortMessage);
}

function addListeners () {
    browser.contextMenus.onClicked.addListener(onContextMenusClicked);
    browser.commands.onCommand.addListener(onCommandsCommand);
    browser.runtime.onConnect.addListener(onRuntimeConnect);
}

function setIcon (icon) {
    browser.browserAction.setIcon({ path: icon });
}

function dirtyCacheSet (key, obj) {
    dirtyCache.set(key, Object.assign(dirtyCache.check(key) ? dirtyCache.get(key) : {}, obj));
    dirtyCache.set(key, Object.assign(dirtyCache.check(key) ? dirtyCache.get(key) : {}, { id: -1, url: key }));
}

function applyDirtyCacheLight (key, data) {
    if (dirtyCache.check(key)) {
        const dirtyObject = dirtyCache.get(key);
        if (!dirtyObject.deleted) {
            if ((dirtyObject.title !== undefined) || (dirtyObject.is_archived !== undefined) ||
                 (dirtyObject.is_starred !== undefined) || (dirtyObject.tagList !== undefined)) {
                data.changed = true;
            }
            data.title = dirtyObject.title !== undefined ? dirtyObject.title : data.title;
            data.is_archived = dirtyObject.is_archived !== undefined ? dirtyObject.is_archived : data.is_archived;
            data.is_starred = dirtyObject.is_starred !== undefined ? dirtyObject.is_starred : data.is_starred;
            data.tagList =
            (dirtyObject.tagList !== undefined ? dirtyObject.tagList.split(',') : [])
            .concat(data.tags.map(t => t.label))
            .filter((v, i, a) => a.indexOf(v) === i)
            .join(',');
        } else {
            data.deleted = true;
        }
    } else {
        data.tagList = data.tags.map(tag => tag.label).join(',');
    }
    return data;
}

function applyDirtyCacheReal (key, data) {
    if (dirtyCache.check(key)) {
        const dirtyObject = dirtyCache.get(key);
        if (dirtyObject.deleted !== undefined) {
            return api.DeleteArticle(data.id).then(a => { dirtyCache.clear(key); });
        } else {
            if (data.changed !== undefined) {
                return api.PatchArticle(data.id, { title: data.title, starred: data.is_starred, archive: data.is_archived, tags: data.tagList })
                .then(data => cache.set(key, data))
                .then(a => { dirtyCache.clear(key); });
            }
        }
    }
    return data;
}
function cutArticle (data) {
    return Object.assign({}, {
        id: data.id,
        is_starred: data.is_starred,
        is_archived: data.is_archived,
        title: data.title,
        url: data.url,
        tags: data.tags,
        tagList: data.tagList,
        domain_name: data.domain_name,
        preview_picture: data.preview_picture
    });
}

function savePageToWallabag (url, resetIcon) {
    if (isServicePage(url)) {
        return;
    }
    // if WIP and was some dirty changes, return dirtyCache
    let exists = existCache.check(url) ? existCache.get(url) : existStates.notexists;
    if (exists === existStates.wip) {
        if (dirtyCache.check(url)) {
            let dc = dirtyCache.get(url);
            postIfConnected({ response: 'state', data: Object.assign(cutArticle(dc), {message: 'Saving the page to wallabag ...'}) });
        }
        return;
    }

    // if article was saved, return cache
    if (cache.check(url)) {
        postIfConnected({ response: 'state', data: cutArticle(cache.get(url)) });
        return;
    }

    // real saving
    setIcon(icons.wip);
    existCache.set(url, existStates.wip);
    postIfConnected({ response: 'state', data: { message: 'Saving the page to wallabag ...' } });
    api.SavePage(url)
            .then(data => applyDirtyCacheLight(url, data))
            .then(data => {
                if (!data.deleted) {
                    setIcon(icons.good);
                    postIfConnected({ response: 'state', data: Object.assign(cutArticle(data), {message: ''}) });
                    // postIfConnected({ response: 'article', article: cutArticle(data) });
                    cache.set(url, data);
                    saveExistFlag(url, existStates.exists);
                    if (resetIcon) {
                        setTimeout(function () { setIcon(icons.default); }, 5000);
                    }
                } else {
                    cache.clear(url);
                }
                return data;
            })
            .then(data => applyDirtyCacheReal(url, data))
            .catch(error => {
                setIcon(icons.bad);
                setTimeout(function () { setIcon(icons.default); }, 5000);
                saveExistFlag(url, existStates.notexists);
                throw error;
            });
};

const GotoWallabag = (part) => api.check() && browser.tabs.create({ url: `${api.data.Url}/${part}/list` });

const checkExist = (url) => {
    if (isServicePage(url)) { return; }
    if (existCache.check(url)) {
        const existsFlag = existCache.get(url);
        if (existsFlag === existStates.exists) {
            setIcon(icons.good);
        }
        if (existsFlag === existStates.wip) {
            setIcon(icons.wip);
        }
    } else {
        requestExists(url);
    }
};

const requestExists = (url) =>
        api.EntryExists(url)
        .then(data => {
            let icon = icons.default;
            if (data.exists) {
                icon = icons.good;
            }
            setIcon(icon);
            saveExistFlag(url, data.exists ? existStates.exists : existStates.notexists);
        });

const saveExistFlag = (url, exists) => {
    existCache.set(url, exists);
};

const isServicePage = (url) => /^(chrome|about|browser):(.*)/.test(url);

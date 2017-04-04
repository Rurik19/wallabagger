var WallabagApi = function () { };

WallabagApi.prototype = {

    defaultValues: {
        Url: null,
        ApiVersion: null,
        ClientId: null,
        ClientSecret: null,
        UserLogin: null,
        UserPassword: null,
        ApiToken: null,
        RefreshToken: null,
        ExpireDateMs: null,
        AllowSpaceInTags: null,
        AllowExistCheck: null,
        Debug: false
    },

    data: {},

    fetchApi: null,

    tags: [],

    init: function () {
        Object.assign(this.data, this.defaultValues);
        this.fetchApi = new FetchApi();
        return this.load();
    },

    resetDebug: function () {
        this.data.Debug = this.defaultValues.Debug;
        this.save();
    },

    save: function () {
        browser.storage.local.set({ 'wallabagdata': this.data });
    },

    load: function () {
        return new Promise((resolve, reject) => {
            browser.storage.local.get('wallabagdata', result => {
                if (result.wallabagdata != null) {
                    this.set(result.wallabagdata);
                    if (this.checkParams()) {
                        return resolve(this.data);
                    } else {
                        this.clear();
                        return reject(new Error('Some parameters are empty. Check the settings'));
                    }
                } else {
                    this.clear();
                    return reject(new Error('Saved parameters not found. Check the settings'));
                }
            });
        });
    },

    needNewAppToken: function () {
        let need = (
                  (this.data.ApiToken === '') ||
                  (this.data.ApiToken === null) ||
                  this.expired()
                   );
        return need;
    },

    checkParams: function () {
        return ((this.data.ClientId !== null) &&
                 (this.data.ClientSecret !== null) &&
                 (this.data.userLogin !== null) &&
                 (this.data.UserPassword !== null) &&
                 (this.data.ClientId !== '') &&
                 (this.data.ClientSecret !== '') &&
                 (this.data.userLogin !== '') &&
                 (this.data.UserPassword !== ''));
    },

    expired: function () {
        return (this.data.ExpireDateMs != null) && (Date.now() > this.data.ExpireDateMs);
    },

    clear: function () {
        this.set(this.defaultValues);
    },

    set: function (params) {
        Object.assign(this.data, params);
    },

    setsave: function (params) {
        this.set(params);
        this.save;
    },

    CheckUrl: function () {
        let url_ = this.data.Url + '/api/version';
        return this.fetchApi.Get(url_, '')
            .then(fetchData => { this.data.ApiVersion = fetchData; return fetchData; })
            .catch(error => {
                throw new Error(`Failed to get api version ${url_}
                ${error.message}`);
            });
    },

    SaveTitle: function (articleId, articleTitle) {
        return this.PatchArticle(articleId, { title: articleTitle });
    },

    SaveStarred: function (articleId, articleStarred) {
        return this.PatchArticle(articleId, { starred: articleStarred });
    },

    SaveArchived: function (articleId, articleArchived) {
        return this.PatchArticle(articleId, { archive: articleArchived });
    },

    SaveTags: function (articleId, taglist) {
        return this.PatchArticle(articleId, { tags: taglist });
    },

    PatchArticle: function (articleId, content) {
        let entryUrl = `${this.data.Url}/api/entries/${articleId}.json`;
        return this.CheckToken().then(a =>
                this.fetchApi.Patch(entryUrl, this.data.ApiToken, content)
            )
            .catch(error => {
                throw new Error(`Failed to update article ${entryUrl}
                ${error.message}`);
            });
    },
    /** Delete article
     * @param articleId {number} Article identificator
     */
    DeleteArticle: function (articleId) {
        let entryUrl = `${this.data.Url}/api/entries/${articleId}.json`;
        return this.CheckToken().then(a =>
                this.fetchApi.Delete(entryUrl, this.data.ApiToken)
            )
             .catch(error => {
                 throw new Error(`Failed to delete article ${entryUrl}
                ${error.message}`);
             });
    },

    DeleteArticleTag: function (articleId, tagid) {
        let entryUrl = `${this.data.Url}/api/entries/${articleId}/tags/${tagid}.json`;
        return this.CheckToken().then(a =>
                this.fetchApi.Delete(entryUrl, this.data.ApiToken)
            )
            .catch(error => {
                throw new Error(`Failed to delete article tag ${entryUrl}
                ${error.message}`);
            });
    },

    CheckToken: function () {
        return new Promise((resolve, reject) => {
            if (this.needNewAppToken()) {
                resolve(this.GetAppToken());
            }
            resolve(1);
        });
    },

    SavePage: function (pageUrl) {
        let content = { url: pageUrl };
        let entriesUrl = `${this.data.Url}/api/entries.json`;
        return this.CheckToken().then(a =>
                this.fetchApi.Post(entriesUrl, this.data.ApiToken, content)
            )
            .catch(error => {
                throw new Error(`Failed to save page ${entriesUrl}
                ${error.message}`);
            });
    },

    RefreshToken: function () {
        let content = {
            grant_type: 'refresh_token',
            refresh_token: this.data.RefreshToken,
            client_id: this.data.ClientId,
            client_secret: this.data.ClientSecret
        };
        let oauthurl = `${this.data.Url}/oauth/v2/token`;
        return this.fetchApi.Post(oauthurl, '', content)
            .then(data => {
                if (data !== '') {
                    this.data.ApiToken = data.access_token;
                    this.data.RefreshToken = data.refresh_token;
                    let nowDate = new Date(Date.now());
                    this.data.ExpireDateMs = nowDate.setSeconds(nowDate.getSeconds() + data.expires_in);
                    return data;
                }
            })
            .catch(error => {
                throw new Error(`Failed to refresh token ${oauthurl}
                ${error.message}`);
            });
    },

    GetTags: function () {
        let entriesUrl = `${this.data.Url}/api/tags.json`;
        return this.CheckToken().then(a =>
                this.fetchApi.Get(entriesUrl, this.data.ApiToken)
            )
            .then(fetchData => {
                this.tags = fetchData;
                return fetchData;
            })
            .catch(error => {
                throw new Error(`Failed to get tags ${entriesUrl}
                ${error.message}`);
            });
    },

    EntryExists: function (url) {
        let entriesUrl = `${this.data.Url}/api/entries/exists.json?url=${url}`;

        return this.CheckToken().then(a =>
              this.fetchApi.Get(entriesUrl, this.data.ApiToken)
            )
            .catch(error => {
                throw new Error(`Failed to check if exists ${entriesUrl}
                ${error.message}`);
            });
    },

    GetArticle: function (articleId) {
        let entriesUrl = `${this.data.Url}/api/entries/${articleId}.json`;
        return this.CheckToken().then(a =>
                this.fetchApi.Get(entriesUrl, this.data.ApiToken)
            )
            .catch(error => {
                throw new Error(`Failed to get article ${entriesUrl}
                ${error.message}`);
            });
    },

    GetArticleTags: function (articleId) {
        let entriesUrl = `${this.data.Url}/api/entries/${articleId}/tags.json`;
        return this.CheckToken().then(a =>
                this.fetchApi.Get(entriesUrl, this.data.ApiToken)
            )
            .catch(error => {
                throw new Error(`Failed to get article tags ${entriesUrl}
                ${error.message}`);
            });
    },

    GetAppToken: function () {
        let content = {
            grant_type: 'password',
            client_id: this.data.ClientId,
            client_secret: this.data.ClientSecret,
            username: this.data.UserLogin,
            password: this.data.UserPassword
        };

        let oauthurl = `${this.data.Url}/oauth/v2/token`;
        return this.fetchApi.Post(oauthurl, '', content)
            .then(fetchData => {
                let nowDate = (new Date());
                this.data.ApiToken = fetchData.access_token;
                this.data.RefreshToken = fetchData.refresh_token;
                this.data.ExpireDateMs = nowDate.setSeconds(nowDate.getSeconds() + fetchData.expires_in);
                return fetchData;
            }).catch(error => {
                throw new Error(`Failed to get app token from ${oauthurl}
                ${error.message}`);
            });
    }

};

//* globals hyperHTML */
let articleElement = document.querySelector('body');
function render (State) {
    hyperHTML.bind(articleElement)`
    <div class="card">
        <div id="card-image" class="card-image">
            <img src="${State.preview_picture}" class="card-image img-responsive"/>
        </div>
        <div class="${'card-header' + (State.editMode ? ' hide' : '')}">
            <a id="card-title"  href="${State.Url + '/view/' + State.id}" title="Go to Wallabag's article page">${State.title}</a>
        </div>
        <div class="${'card-body' + (State.editMode ? '' : ' hide')}" id="title-edit">
            <textarea class="form-input" id="title-input" rows="3"></textarea>
            <button class="btn btn-link" onclick="${saveEdit}">Save</button>
            <button class="btn btn-link" onclick="${toggleEdit}">Cancel</button>
        </div>
        <div class="card-footer">
            <a id="entry-url" class="card-meta" href="${State.tabUrl}" title="Go to this article page">${State.domain_name}</a>
            <button
                class="action-button float-right card-meta icon icon-bin"
                id="delete-icon"
                onclick="${openDeleteDialog}"
                title="Remove this article from Wallabag"></button>
            <button
                onclick="${toggleStarred}"
                class="${'action-button float-right card-meta icon icon-star' + (State.is_starred === 0 ? '' : '-full')}"
                title="${(State.is_starred === 0 ? 'Set' : 'Unset') + ' this article as starred into Wallabag'}"</button>
            <button
                onclick="${toggleArchived}"
                class="${'action-button float-right card-meta icon icon-checkmark' + (State.is_archived === 0 ? '' : '-full')}"
                title="${(State.is_archived === 0 ? 'Set' : 'Unset') + ' this article as archived into Wallabag'}"</button>
            <button
                class="action-button float-right card-meta icon icon-pencil"
                id="edit-icon"
                onclick="${toggleEdit}"
                title="Edit the Wallabag title of this article"></button>
        </div>
        <div class="card-footer" id="tags">
            <div class="form-autocomplete">
                <div class="form-autocomplete-input" id="tags-input-container">
                    <span class="card-meta float-left icon icon-tags" style="margin-top: 5px;"></span>
                    ${State.tags.map(renderTag)}
                    <input class="form-input" type="text" placeholder="type tags here" id="tags-input"/>
                    <ul class="form-autocomplete-list hide" id="tags-autocomplete-list">
                        <li class="card-meta float-left form-autocomplete-item" style="margin-top: 5px;">Tags found: </li>
                    </ul>
                </div>
            </div>
        </div>

    </div>
    <div class="${'toast' + (State.message === '' ? ' hide' : '')}" id="info-toast">${State.message}</div>
    <div class="modal modal-sm" id="delete_confirmation">
        <div class="modal-overlay"></div>
        <div class="modal-container">
            <div class="modal-header">
                <button class="btn btn-clear float-right" onclick="${closeDeleteDialog}"></button>
                <div class="modal-title">Delete this article</div>
            </div>
            <div class="modal-body">
                <div class="content">
                    <h4 class="centered mt-10">Deleting removes article from wallabag permanently</h4>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-link" onclick="${deleteArticle}">Yes, Delete it</button>
                <button class="btn btn-primary" onclick="${closeDeleteDialog}">No, leave it</button>
            </div>
        </div>
    </div>
    `;
    if (State.editMode) {
        document.getElementById('title-input').value = State.title;
        document.getElementById('title-input').focus();
    }
}

const renderError = msg => hyperHTML.bind(articleElement)`
<div class="toast toast-danger" id="error-toast">${msg}</div>
`;

const renderTag = tag => hyperHTML.wire()`
<div class="chip-sm" data-tagid="${tag.id} data-taglabel="${tag.label}">
    <span class="chip-name">${tag.label}</span>
    <button class="btn btn-clear" onclick="${deleteTag}"></button>
</div>
`;

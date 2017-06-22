/* globals $$, Controller */
const EventHandler = {
    init: function () {
        $$('edit-icon').on('click', editIconClick);
        $$('cancel-edit').on('click', editCancelClick);
        $$('save-edit').on('click', this.saveTitleClick.bind(this));
        $$('archived-icon').on('click', this.archivedIconClick.bind(this));
        $$('starred-icon').on('click', this.starredIconClick.bind(this));
        $$('delete-btn').on('click', this.deleteClick.bind(this));
        $$('delete-icon').on('click', deleteIconClick);
        $$('cancel-delete-cross').on('click', deleteCancel);
        $$('cancel-delete').on('click', deleteCancel);
        $$('tags-input').on('input', this.tagsInputChanged.bind(this));
    //    this.tagsInput.addEventListener('keyup', this.onTagsInputKeyUp.bind(this));
    },
    saveTitleClick: function () {
        Controller.saveTitle($$('title-input').value());
        $$('card-title').content($$('title-input').value());
        $$('title-edit').hide();
        $$('card-title').show();
        $$('tags-input').focus();
    },
    archivedIconClick: function () {
        Controller.toggleArchived();
        $$('tags-input').focus();
    },
    starredIconClick: function () {
        Controller.toggleStarred();
        $$('tags-input').focus();
    },
    deleteClick: function () {
        Controller.deleteArticle();
    },
    tagsInputChanged: function () {
        let value = $$('tags-input').value();
        if (value !== '') {
            const lastChar = value.slice(-1);
            if ((lastChar === ',') || (lastChar === ';') || ((lastChar === ' ') && (!this.Controller.State.AllowSpaceInTags))) {
                value = value.slice(0, -1);
                if (value !== '') {
                    Controller.SetTags(value);
                }
                this.tagsInput.value = '';
            } else {
                if (value.length >= 3) {
                    Controller.FindTags(value);
                }
            }
        }
    }
};

const editIconClick = () => {
    $$('title-input').value($$('card-title').content());
    $$('card-title').hide();
    $$('title-edit').show();
    $$('title-input').focus();
};

const editCancelClick = () => {
    $$('title-edit').hide();
    $$('card-title').show();
    $$('tags-input').focus();
};

const deleteIconClick = () => {
    $$('delete_confirmation').activate();
};

const deleteCancel = () => {
    $$('delete_confirmation').deactivate();
};

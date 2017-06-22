//* globals $$, Controller */
const iconDefClass = 'action-button float-right card-meta icon';

const render = (State) => {
    $$('card-image').attr('src', State.preview_picture);
    $$('card-title').attr('href', `${State.Url}/view/${State.id}`);
    $$('entry-url').attr('href', State.tabUrl);
    $$('starred-icon')
      .attr('class', `${iconDefClass} icon-star${State.is_starred === 0 ? '' : '-full'}`)
      .attr('title', `${(State.is_starred === 0 ? 'Set' : 'Unset')} this article as starred into Wallabag`);
    $$('archived-icon')
      .attr('class', `${iconDefClass} icon-checkmark${State.is_starred === 0 ? '' : '-full'}`)
      .attr('title', `${(State.is_starred === 0 ? 'Set' : 'Unset')} this article as archived into Wallabag`);
    (State.message === '' ? $$('info-toast').hide() : $$('info-toast').show()).content(State.message);
    $$('tags-container').content('');
    State.tagList.split(',').map(renderTag);
    $$('tags-autocomplete-list').content('');
    State.foundTagList.split(',').map(renderFoundTag);
};

const renderTag = (tag) => {
    $$('tags-container').el.appendChild(createTagChip(tag));
};

const createTagChip = (tag) => {
    let el = $$('tag-template').clone().attr('id', `tag${Math.random()}`).show().el;
    $$(el.firstChild).content(tag);
    $$(el.lastChild).on('click', (e) => { Controller.deleteTag(e.currentTarget.textContent); });
    return el;
};

const renderFoundTag = (tag) => {
    $$('tags-autocomplete-list').el.appendChild(createFndTagChip(tag));
};

const createFndTagChip = (tag) => {
    let el = $$('tag-fnd-template').clone().attr('id', `tag${Math.random()}`).show().el;
    $$(el.firstChild).content(tag).on('click', (e) => { Controller.SetTags(e.currentTarget.textContent); });
    return el;
};

const renderError = (msg) => {
    $$('card-image').hide();
    $$('error-toast').content(msg).show();
};

// my little jquery :-)
(function () {
    var $$ = function (id) {
        if (id.nodeType === 1) {
            this.el = id;
        } else {
            this.el = document.getElementById(id); 
        }
        return this;
    };
    $$.prototipe.on = function (event, func) {
        this.el.addEventListener(event, func); return this;
    };
    $$.prototipe.hide = function () {
        this.el.classList.add('hide'); return this;
    };
    $$.prototipe.show = function () {
        this.el.classList.remove('hide'); return this;
    };
    $$.prototipe.focus = function () {
        this.el.focus(); return this;
    };
    $$.prototipe.value = function (val) {
        if (val === undefined) {
            return this.el.value;
        } else {
            this.el.value = val; return this;
        }
    };
    $$.prototipe.content = function (val) {
        if (val === undefined) {
            return this.el.textContent;
        } else {
            this.el.textContent = val; return this;
        }
    };
    $$.prototipe.activate = function () {
        this.el.classList.add('active'); return this;
    };
    $$.prototipe.deactivate = function () {
        this.el.classList.remove('active'); return this;
    };
    $$.prototipe.attr = function (attr, val) {
        if (val === undefined) {
            return this.el.getAttribute(attr);
        } else {
            this.el.setAttrubute(attr, val); return this;
        }
    };
    $$.prototipe.clone = function () {
        this.el = this.el.cloneNode(true); return this;
    };
}());


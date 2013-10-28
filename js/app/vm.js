
(function(App){

    var diffX, diffY;
    var lastX, lastY;

    App.vm = {
        mode: ko.observable('doc'), // doc | form | desk
        disabledAdd: ko.observable(true),
        disabledDelete: ko.observable(true),
        disabledDoc: ko.observable(true),
        disabledKey: ko.observable(true),
        formAppKey: ko.observable(''),
        formFocus: ko.observable(false),
        statusLoad: ko.observable(false),
        statusSave: ko.observable(false),
        textLoad: ko.observable('Load'),
        textSave: ko.observable('Save'),

        elemMoveSize: null,
        notes: ko.observableArray(),
        noteSelected: null
    };

    // -----------------------------

    App.vm.disabledLoad = ko.computed(function() {
        return !(App.vm.mode() == 'desk' && App.vm.statusLoad());
    });

    App.vm.disabledSave = ko.computed(function() {
        return !(App.vm.mode() == 'desk' && App.vm.statusSave());
    });

    App.vm.visibleDesk = ko.computed(function() {
        return App.vm.mode() == 'desk';
    });

    App.vm.visibleDoc = ko.computed(function() {
        return App.vm.mode() == 'doc';
    });

    App.vm.visibleForm = ko.computed(function() {
        return App.vm.mode() == 'form';
    });

    // -------------------------------

    App.vm.add = function(elem) {

        var note = {
            data: elem,
            left: ko.observable(elem.x + 'px'),
            top: ko.observable(elem.y + 'px'),
            index: ko.observable(App.vm.notes().length + 1),
            width: ko.observable(elem.width + 'px'),
            height: ko.observable(elem.height + 'px'),
            content: ko.observable(elem.content),
            created: ko.observable(elem.created),
            modified: ko.observable(elem.modified),
            tpl: ko.observable('noteview')
        }

        note.contentView = function() {
            var data = note.content().split("\n");
            // title raus
            data.shift();
            var txt = data.join("\n");

            var exp = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
            txt = txt.replace(exp,"<a href='$1'>$1</a>");

            return txt.replace(/\n/g, '<br />');
        }

        note.dateFormatted = ko.computed(function() {
            var language = window.navigator.userLanguage || window.navigator.language;
            var da = new Date(note.created());

            var t = da.getDate() + '.';
            t += da.getMonth() + 1;
            t += '.';
            return t;
        });

        note.title = ko.computed(function() {
            App.store.updateNote(note.data, {content: note.content()});
            App.store.save();
            App.vm.checkUnsaved();

            var data = note.content().split("\n");
            if (data.length > 0) {
                return data[0];
            }
            return 'no title';
        });

        App.vm.notes.push(note);
        App.vm.checkUnsaved();
    }

    App.vm.checkUnsaved = function() {
        var t = App.store.countUnsaved();
        if (t > 0) {
            App.vm.textSave('Save(' + t + ')');
        } else {
            App.vm.textSave('Save');
        }
    }

    App.vm.focusSelected = function(item) {
        return App.vm.noteSelected == item && App.vm.mode() == 'desk';
    }

    App.vm.index = function(note) {
        var t, k;
        var i = note.index();

        for (t = 0; t < App.vm.notes().length; t++) {
            k = App.vm.notes()[t].index();
            if (k > i) {
                App.vm.notes()[t].index(k - 1);
            }
        }
        note.index(App.vm.notes().length);
    }

    App.vm.refreshNote = function(elem) {
        var t;

        for (t = 0; t < App.vm.notes().length; t++) {
            if (elem == App.vm.notes()[t].data) {
                App.vm.notes()[t].left(elem.x + 'px');
                App.vm.notes()[t].top(elem.y + 'px');
                App.vm.notes()[t].width(elem.width + 'px');
                App.vm.notes()[t].height(elem.height + 'px');
                App.vm.notes()[t].content(elem.content);
            }
        }
    }

    App.vm.selectItem = function(item) {
        if (item == App.vm.noteSelected) {
            return;
        }

        if (App.vm.noteSelected) {
            // unselect old or same
            App.vm.noteSelected.tpl('noteview');
            App.vm.noteSelected = null;
        }

        App.vm.noteSelected = item;
        App.vm.disabledDelete(false);
        App.vm.index(item);
        item.tpl('noteselected');
        return;
    }

    App.vm.setMode = function(value) {
        if (value == 'desk') {
            App.vm.mode('desk');
            App.vm.formFocus(false);
            App.vm.disabledAdd(false);
            App.vm.disabledDoc(false);
            App.vm.disabledKey(false);
        }
        if (value == 'doc') {
            App.vm.mode('doc');
            App.vm.formFocus(false);
            App.vm.disabledAdd(true);
            App.vm.disabledDoc(true);
            App.vm.disabledKey(true);
        }
        if (value == 'form') {
            App.vm.mode('form');
            App.vm.formFocus(true);
            App.vm.disabledAdd(true);
            App.vm.disabledDoc(true);
            App.vm.disabledKey(true);
        }
    }

    App.vm.template = function(item) {
        return item.tpl()
    }

    App.vm.unselectItem = function() {
        if (App.vm.noteSelected) {
            App.vm.noteSelected.tpl('noteview');
            App.vm.noteSelected = null;
            App.vm.disabledDelete(true);
        }
    }

    // --------------------------------

    App.vm.clickAdd = function() {
        var elem = App.store.create({});
        App.store.add(elem);
        App.store.save();
        App.vm.add(elem);
    }

    App.vm.clickBody = function(item, event) {
        console.log('bodyClick');
        if (event.target.tagName == 'BODY') {
            App.vm.unselectItem();
            return;
        }
        if (event.target.tagName == 'A') {
            console.log(event.target.target);
            window.open(event.target.href, event.target.target);
        }
    }

    App.vm.clickDebug = function() {
        console.log('debug:');

        console.log(App.store.data);
        /*var t;

        for (t = 0; t < App.vm.notes().length; t++) {
            console.log('z-index: ' + App.vm.notes()[t].index() + ' id: ' + App.vm.notes()[t].data.id);
        }*/
    }

    App.vm.clickDelete = function(item, event) {
        var note = App.vm.noteSelected;
        var i = note.index();
        var k;

        if (confirm("Are you sure?")) {
            App.vm.unselectItem();
            App.store.delete(note.data);
            App.store.save();
            App.vm.notes.remove(note);

            for (t = 0; t < App.vm.notes().length; t++) {
                k = App.vm.notes()[t].index();
                if (k > i) {
                    App.vm.notes()[t].index(k - 1);
                }
            }

            App.vm.checkUnsaved();
        }
    }

    App.vm.clickDoc = function(item, event) {
        App.vm.unselectItem();
        App.vm.setMode('doc');
        event.stopPropagation();
    }

    App.vm.clickFormCancel = function() {
        console.log('clickFormCancel');
        App.vm.setMode('desk');
    }

    App.vm.clickFormSave = function() {
        console.log('clickFormSave');
        var key = App.vm.formAppKey().trim();
        if (key.length > 0) {
            App.store.data.floppy.name = 'dropbox';
            App.store.data.floppy.key = key;
            App.store.save();
            App.vm.setMode('desk');
        } else {
            alert('Please enter your app key!');
            App.vm.formFocus(true);
        }
    }

    App.vm.clickLoad = function(item, event) {
        console.log('clickLoad');
        App.sync.load(true);
        event.stopPropagation();
    }

    App.vm.clickKey = function(item, event) {
        App.vm.unselectItem();
        if (App.store.data.floppy.key) {
            App.vm.formAppKey(App.store.data.floppy.key);
        }
        App.vm.setMode('form');
        event.stopPropagation();
    }

    App.vm.clickNote = function(item, event) {
        if (event.target.tagName == 'A') {
            window.open(event.target.href, '_blank');
            return;
        }
        App.vm.selectItem(item);
        event.stopPropagation();
    }

    App.vm.clickOkay = function() {
        App.vm.setMode('desk');
        event.stopPropagation();
    }

    App.vm.clickSave = function(item, event) {
        console.log('clickSave');
        App.sync.save();
        event.stopPropagation();
    }


    // ******************************************
    //
    //
    // ******************************************


    // ------move ---------------------------------

    App.vm.mouseDown = function(item, event) {
        App.vm.index(item);
        App.vm.elemMoveSize = item;

        // save diff
        lastX = item.data.x;
        lastY = item.data.y;
        diffX = event.originalEvent.pageX - lastX;
        diffY = event.originalEvent.pageY - lastY;
        // console.log('mouseDown: diff: ' + diffX + 'x' + diffY);

        var el = document.getElementById("idbody");
        if (event.type == 'touchstart') {
            el.addEventListener('touchmove', App.vm.noteMove);
            el.addEventListener('touchend', App.vm.noteUp);
        } else {
            el.addEventListener('mousemove', App.vm.noteMove);
            el.addEventListener('mouseup', App.vm.noteUp);
            el.addEventListener('mouseout', App.vm.noteUp);
        }
    }

    App.vm.noteMove = function(event) {
        lastX = event.pageX - diffX;
        lastY = event.pageY - diffY;
        App.vm.elemMoveSize.left(lastX + 'px');
        App.vm.elemMoveSize.top(lastY + 'px');
    }

    App.vm.noteUp = function(event) {
        var diffX;
        var diffY;

        if (event.type == 'mouseout') {
            diffX = window.innerWidth - event.pageX - 48;
            diffY = window.innerHeight - event.pageY - 48;

            if (event.pageX >= 0 && event.pageY >= 0 && diffX >= 0 && diffY >= 0) {
                return;
            }

            // console.log('out');
        } else {
            // console.log('up');
        }

        var el = document.getElementById("idbody");
        if (event.type == 'touchend') {
            el.removeEventListener('touchmove', App.vm.noteMove);
            el.removeEventListener('touchend', App.vm.noteUp);
        } else {
            el.removeEventListener('mousemove', App.vm.noteMove);
            el.removeEventListener('mouseup', App.vm.noteUp);
            el.removeEventListener('mouseout', App.vm.noteUp, false);
        }

        App.store.updateNote(App.vm.elemMoveSize.data, {x: lastX, y: lastY});
        App.store.save();
        App.vm.checkUnsaved();

        App.vm.elemMoveSize.left(App.vm.elemMoveSize.data.x + 'px');
        App.vm.elemMoveSize.top(App.vm.elemMoveSize.data.y + 'px');
        App.vm.elemMoveSize = null;
    }

    //
    // --------------
    //

    App.vm.sizeStart = function(item, event) {
        App.vm.index(item);
        App.vm.elemMoveSize = item;

        diffX = event.originalEvent.pageX;
        diffY = event.originalEvent.pageY;
        console.log('sizeStart: ' + diffX + 'x' + diffY);

        var el = document.getElementById("idbody");
        if (event.type == 'touchstart') {
            el.addEventListener('touchmove', App.vm.sizeMove);
            el.addEventListener('touchend', App.vm.sizeUp);
        } else {
            el.addEventListener('mousemove', App.vm.sizeMove);
            el.addEventListener('mouseup', App.vm.sizeUp);
            el.addEventListener('mouseout', App.vm.sizeUp, false);
        }
    }

    App.vm.sizeMove = function(event) {
        lastX = event.pageX - diffX;
        lastY = event.pageY - diffY;

        App.vm.elemMoveSize.width((App.vm.elemMoveSize.data.width + lastX) + 'px');
        App.vm.elemMoveSize.height((App.vm.elemMoveSize.data.height + lastY) + 'px');
    }

    App.vm.sizeUp = function(event) {

        if (event.type == 'mouseout') {
            var x = window.innerWidth - event.pageX - 48;
            var y = window.innerHeight - event.pageY - 48;

            if (event.pageX >= 0 && event.pageY >= 0 && x >= 0 && y >= 0) {
                return;
            }

            console.log('out');
        } else {
            console.log('up');
        }


        var el = document.getElementById("idbody");
        if (event.type == 'touchend') {
            el.removeEventListener('touchmove', App.vm.sizeMove);
            el.removeEventListener('touchend', App.vm.sizeUp);
        } else {
            el.removeEventListener('mousemove', App.vm.sizeMove);
            el.removeEventListener('mouseup', App.vm.sizeUp);
            el.removeEventListener('mouseout', App.vm.sizeUp);
        }

        App.store.updateNote(App.vm.elemMoveSize.data, {
            width: App.vm.elemMoveSize.data.width + lastX,
            height: App.vm.elemMoveSize.data.height + lastY
        });
        App.store.save();
        App.vm.checkUnsaved();

        App.vm.elemMoveSize.width(App.vm.elemMoveSize.data.width + 'px');
        App.vm.elemMoveSize.height(App.vm.elemMoveSize.data.height + 'px');
        App.vm.elemMoveSize = null;

        /*

        var diffX = event.clientX - oldX;
        var diffY = event.clientY - oldY;





        diffX = App.vm.elemMoveSize.data.width + diffX;
        diffY = App.vm.elemMoveSize.data.height + diffY;
        App.store.updateNote(App.vm.elemMoveSize.data, {width: diffX, height: diffY});
        App.store.save();
        App.vm.checkUnsaved();

        */
    }

})(App)
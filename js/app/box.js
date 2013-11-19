
(function(App){

    var diffX, diffY;
    var lastX, lastY;

    var box = {
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

    box.disabledLoad = ko.computed(function() {
        return !(box.mode() == 'desk' && box.statusLoad());
    });

    box.disabledSave = ko.computed(function() {
        return !(box.mode() == 'desk' && box.statusSave());
    });

    box.visibleDesk = ko.computed(function() {
        return box.mode() == 'desk';
    });

    box.visibleDoc = ko.computed(function() {
        return box.mode() == 'doc';
    });

    box.visibleForm = ko.computed(function() {
        return box.mode() == 'form';
    });

    // -------------------------------

    box.add = function(elem) {

        var note = {
            data: elem,
            left: ko.observable(elem.x + 'px'),
            top: ko.observable(elem.y + 'px'),
            index: ko.observable(box.notes().length + 1),
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
            App.ram.updateNote(note.data, {content: note.content()});
            App.ram.save();
            box.checkUnsaved();

            var data = note.content().split("\n");
            if (data.length > 0) {
                return data[0];
            }
            return 'no title';
        });

        box.notes.push(note);
        box.checkUnsaved();
    }

    box.checkUnsaved = function() {
        var title = 'Save';
        var t = App.ram.countUnsaved() + App.ram.data.deleted.length;

        if (t > 0) {
            title = 'Save(' + t + ')';
        }
        box.textSave(title);
    }

    box.delete = function(elem) {
        var k;
        var note = box.getNoteByData(elem);
        var i = note.index();

        if (note) {
            box.notes.remove(note);
            App.ram.delete(note.data);
            App.ram.save();

            for (t = 0; t < box.notes().length; t++) {
                k = box.notes()[t].index();
                if (k > i) {
                    box.notes()[t].index(k - 1);
                }
            }
        }
    }

    box.focusSelected = function(item) {
        return box.noteSelected == item && box.mode() == 'desk';
    }

    box.getNoteByData = function(elem) {
        var t, note;

        for (t = 0; t < box.notes().length; t++) {
            note = box.notes()[t];
            if (note.data == elem) {
                return note;
            }
        }
        return null;
    }

    box.index = function(note) {
        var t, k;
        var i = note.index();

        for (t = 0; t < box.notes().length; t++) {
            k = box.notes()[t].index();
            if (k > i) {
                box.notes()[t].index(k - 1);
            }
        }
        note.index(box.notes().length);
    }

    box.refreshNote = function(elem) {
        var t;

        for (t = 0; t < box.notes().length; t++) {
            if (elem == box.notes()[t].data) {
                box.notes()[t].left(elem.x + 'px');
                box.notes()[t].top(elem.y + 'px');
                box.notes()[t].width(elem.width + 'px');
                box.notes()[t].height(elem.height + 'px');
                box.notes()[t].content(elem.content);
            }
        }
    }

    box.selectItem = function(item) {
        if (item == box.noteSelected) {
            return;
        }

        if (box.noteSelected) {
            // unselect old or same
            box.noteSelected.tpl('noteview');
            box.noteSelected = null;
        }

        box.noteSelected = item;
        box.disabledDelete(false);
        box.index(item);
        item.tpl('noteselected');
        return;
    }

    box.setMode = function(value) {
        if (value == 'desk') {
            box.mode('desk');
            box.formFocus(false);
            box.disabledAdd(false);
            box.disabledDoc(false);
            box.disabledKey(false);
        }
        if (value == 'doc') {
            box.mode('doc');
            box.formFocus(false);
            box.disabledAdd(true);
            box.disabledDoc(true);
            box.disabledKey(true);
        }
        if (value == 'form') {
            box.mode('form');
            box.formFocus(true);
            box.disabledAdd(true);
            box.disabledDoc(true);
            box.disabledKey(true);
        }
    }

    box.template = function(item) {
        return item.tpl()
    }

    box.unselectItem = function() {
        if (box.noteSelected) {
            box.noteSelected.tpl('noteview');
            box.noteSelected = null;
            box.disabledDelete(true);
        }
    }

    // --------------------------------

    box.clickAdd = function() {
        var elem = App.ram.create({});
        App.ram.add(elem);
        App.ram.save();
        box.add(elem);
    }

    box.clickBody = function(item, event) {
        console.log('bodyClick');
        if (event.target.tagName == 'BODY') {
            box.unselectItem();
            return;
        }
        if (event.target.tagName == 'A') {
            console.log(event.target.target);
            window.open(event.target.href, event.target.target);
        }
    }

    box.clickDelete = function(item, event) {
        var note = box.noteSelected;

        if (confirm("Are you sure?")) {
            box.unselectItem();
            box.delete(note.data);
            box.checkUnsaved();
        }
    }

    box.clickDoc = function(item, event) {
        box.unselectItem();
        box.setMode('doc');
        event.stopPropagation();
    }

    box.clickFormCancel = function() {
        console.log('clickFormCancel');
        box.setMode('desk');
    }

    box.clickFormSave = function() {
        console.log('clickFormSave');
        var key = box.formAppKey().trim();
        if (key.length > 0) {
            if (key != App.ram.data.floppy.name) {
                App.ram.data.floppy.name = 'dropbox';
                App.ram.data.floppy.key = key;
                App.ram.save();
                // reload page
                window.location.reload();
            }
            box.setMode('desk');
        } else {
            alert('Please enter your app key!');
            box.formFocus(true);
        }
    }

    box.clickLoad = function(item, event) {
        console.log('clickLoad');
        App.floppy.load(true);
        event.stopPropagation();
    }

    box.clickKey = function(item, event) {
        box.unselectItem();
        if (App.ram.data.floppy.key) {
            box.formAppKey(App.ram.data.floppy.key);
        }
        box.setMode('form');
        event.stopPropagation();
    }

    box.clickNote = function(item, event) {
        if (event.target.tagName == 'A') {
            window.open(event.target.href, '_blank');
            return;
        }
        box.selectItem(item);
        event.stopPropagation();
    }

    box.clickOkay = function(item, event) {
        box.setMode('desk');
        event.stopPropagation();
    }

    box.clickSave = function(item, event) {
        console.log('clickSave');
        App.floppy.save();
        event.stopPropagation();
    }


    // ******************************************
    //
    //
    // ******************************************


    // ------move ---------------------------------

    box.mouseDown = function(item, event) {
        box.index(item);
        box.elemMoveSize = item;

        // save diff
        lastX = item.data.x;
        lastY = item.data.y;
        diffX = event.originalEvent.pageX - lastX;
        diffY = event.originalEvent.pageY - lastY;
        // console.log('mouseDown: diff: ' + diffX + 'x' + diffY);

        var el = document.getElementById("idbody");
        if (event.type == 'touchstart') {
            el.addEventListener('touchmove', box.noteMove);
            el.addEventListener('touchend', box.noteUp);
        } else {
            el.addEventListener('mousemove', box.noteMove);
            el.addEventListener('mouseup', box.noteUp);
            el.addEventListener('mouseout', box.noteUp);
        }
    }

    box.noteMove = function(event) {
        lastX = event.pageX - diffX;
        lastY = event.pageY - diffY;
        box.elemMoveSize.left(lastX + 'px');
        box.elemMoveSize.top(lastY + 'px');
    }

    box.noteUp = function(event) {
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
            el.removeEventListener('touchmove', box.noteMove);
            el.removeEventListener('touchend', box.noteUp);
        } else {
            el.removeEventListener('mousemove', box.noteMove);
            el.removeEventListener('mouseup', box.noteUp);
            el.removeEventListener('mouseout', box.noteUp, false);
        }

        App.ram.updateNote(box.elemMoveSize.data, {x: lastX, y: lastY});
        App.ram.save();
        box.checkUnsaved();

        box.elemMoveSize.left(box.elemMoveSize.data.x + 'px');
        box.elemMoveSize.top(box.elemMoveSize.data.y + 'px');
        box.elemMoveSize = null;
    }

    //
    // --------------
    //

    box.sizeStart = function(item, event) {
        box.index(item);
        box.elemMoveSize = item;

        diffX = event.originalEvent.pageX;
        diffY = event.originalEvent.pageY;
        console.log('sizeStart: ' + diffX + 'x' + diffY);

        var el = document.getElementById("idbody");
        if (event.type == 'touchstart') {
            el.addEventListener('touchmove', box.sizeMove);
            el.addEventListener('touchend', box.sizeUp);
        } else {
            el.addEventListener('mousemove', box.sizeMove);
            el.addEventListener('mouseup', box.sizeUp);
            el.addEventListener('mouseout', box.sizeUp, false);
        }
    }

    box.sizeMove = function(event) {
        lastX = event.pageX - diffX;
        lastY = event.pageY - diffY;

        box.elemMoveSize.width((box.elemMoveSize.data.width + lastX) + 'px');
        box.elemMoveSize.height((box.elemMoveSize.data.height + lastY) + 'px');
    }

    box.sizeUp = function(event) {

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
            el.removeEventListener('touchmove', box.sizeMove);
            el.removeEventListener('touchend', box.sizeUp);
        } else {
            el.removeEventListener('mousemove', box.sizeMove);
            el.removeEventListener('mouseup', box.sizeUp);
            el.removeEventListener('mouseout', box.sizeUp);
        }

        App.ram.updateNote(box.elemMoveSize.data, {
            width: box.elemMoveSize.data.width + lastX,
            height: box.elemMoveSize.data.height + lastY
        });
        App.ram.save();
        box.checkUnsaved();

        box.elemMoveSize.width(box.elemMoveSize.data.width + 'px');
        box.elemMoveSize.height(box.elemMoveSize.data.height + 'px');
        box.elemMoveSize = null;
    }

    App.box = box;

})(App)

(function(App){

    var ram = {
        data: {
            version: 1,
            floppy: {
                name: null, // if name is set, use it
                key: null
            },
            notes: [],
            deleted: [] // array with deleted ids - cleared by floppy
        }
    };

    ram.add = function(elem) {
        var t, k = [];

        ram.data.notes.push(elem);
        // check deleted

        for (t = 0; t < ram.data.deleted.length; t++) {
            if (ram.data.deleted[t] != elem.id) {
                k.push(ram.data.deleted[t]);
            }
        }
        ram.data.deleted = k;
    }

    ram.countUnsaved = function() {
        var t, count = 0;

        for (t = 0; t < ram.data.notes.length; t++) {
            found = ram.data.notes[t];
            if (ram.data.notes[t].id == null || ram.data.notes[t].changed) {
                count++;
            }
        }
        return count;
    }

    ram.create = function(spec) {
        var da = new Date();
        var elem = {
            id: spec.id || null, // id for dropbox and other
            version: spec.version || 1, // version
            changed: spec.changed || false,
            x: spec.x || 200, // css-left
            y: spec.y || 200, // css-top
            width: spec.width || 256, // css-width
            height: spec.height || 256, // css-height
            content: spec.content ||  'some text',
            created: spec.created || da.getTime(),
            modified: spec.modified || da.getTime()
        }
        return elem;
    }

    ram.delete = function(elem) {
        var t, found, temp = [];

        for (t = 0; t < ram.data.notes.length; t++) {
            found = ram.data.notes[t];
            if (found != elem) {
                temp.push(found);
            }
        }
        ram.data.notes = temp;
        if (elem.id) {
            ram.data.deleted.push(elem.id);
        }
    }

    /*ram.equal = function(elem1, elem2) {
        if (elem1.x != elem2.x || elem1.y != elem2.y) {
            return false;
        }
        if (elem1.width != elem2.width || elem1.height != elem2.height) {
            return false;
        }
        if (elem1.content != elem2.content) {
            return false;
        }
        return true;
    }*/

    ram.findById = function(id) {
        var t;

        for (t = 0; t < ram.data.notes.length; t++) {
            if (ram.data.notes[t].id == id) {
                return ram.data.notes[t];
            }
        }
        return null;
    }

    /**
     * check localstore
     */
    ram.init = function() {
        var elem, store = null;

        try {
            store = amplify.store("webdock");
        }  catch( error ) {
            store = null;
            alert(error.message);
        }

        if (store) {
            if (store.hasOwnProperty('version')) {

                console.log('found localstore');
                App.box.setMode('desk');

                if (store.hasOwnProperty('floppy')) {
                    ram.data.floppy = store.floppy;
                }

                if (store.hasOwnProperty('notes')) {
                    for (t = 0; t < store.notes.length; t++) {
                        elem = ram.create(store.notes[t]);
                        ram.add(elem);
                        App.box.add(elem);
                    }
                }

                if (store.hasOwnProperty('deleted')) {
                    ram.data.deleted = store.deleted;
                }

                // if floppy
                if (ram.data.floppy.name == 'dropbox') {
                    // sync
                    App.floppy.init();
                }
            }

        } else {
            console.log('no localstore');
        }

    }

    ram.save = function() {
        try {
            amplify.store("webdock", ram.data);
        }  catch( error ) {
            alert(error);
        }
    }

    ram.size = function()
    {
        return JSON.stringify(ram.data).length;
    }

    ram.sizeFormatted = function()
    {
        var l = ram.size();
        if (l < 1024) {
            return l + ' Bytes';
        }
        l = Math.floor(l / 1024);
        if (l < 1024) {
            return l + ' KiB';
        }
        l = Math.floor(l / 1024);
        return l + ' MiB';
    }

    ram.updateNote = function(elem, changes) {
        var t, k;
        var found = false;
        var attrs = ['x', 'y', 'width', 'height', 'content'];

        for (t = 0; t < attrs.length; t++) {
            k = attrs[t];
            if (changes.hasOwnProperty(k)) {
                if (elem[k] != changes[k]) {
                    elem[k] = changes[k];
                    found = true;
                }
            }
        }

        if (elem.id == null) {
            return;
        }

        if (found) {
            elem.changed = true;
        }

    }

    App.ram = ram;

})(App)


(function(App){

    App.store = {
        data: {
            version: 1,
            floppy: {
                name: null, // if name is set, use it
                key: null
            },
            notes: []
        }
    };

    App.store.add = function(elem) {
        App.store.data.notes.push(elem);
    }

    App.store.countUnsaved = function() {
        var t, count = 0;

        for (t = 0; t < App.store.data.notes.length; t++) {
            found = App.store.data.notes[t];
            if (App.store.data.notes[t].id == null || App.store.data.notes[t].changed) {
                count++;
            }
        }
        return count;
    }

    App.store.create = function(spec) {
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

    App.store.delete = function(elem) {
        var t, found, temp = [];

        for (t = 0; t < App.store.data.notes.length; t++) {
            found = App.store.data.notes[t];
            if (found != elem) {
                temp.push(found);
            }
        }
        App.store.data.notes = temp;
    }

    /*App.store.equal = function(elem1, elem2) {
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

    App.store.findById = function(id) {
        var t;

        for (t = 0; t < App.store.data.notes.length; t++) {
            if (App.store.data.notes[t].id == id) {
                return App.store.data.notes[t];
            }
        }
        return null;
    }

    /**
     * check localstore
     */
    App.store.init = function() {
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
                App.vm.setMode('desk');

                if (store.hasOwnProperty('floppy')) {
                    App.store.data.floppy = store.floppy;
                }

                if (store.hasOwnProperty('notes')) {
                    for (t = 0; t < store.notes.length; t++) {
                        elem = App.store.create(store.notes[t]);
                        App.store.add(elem);
                        App.vm.add(elem);
                    }
                }

                // if floppy
                if (App.store.data.floppy.name == 'dropbox') {
                    // sync
                    App.sync.init();
                }
            }

        } else {
            console.log('no localstore');
        }

    }

    App.store.save = function() {
        try {
            amplify.store("webdock", App.store.data);
        }  catch( error ) {
            alert(error);
        }
    }

    App.store.updateNote = function(elem, changes) {
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

})(App)

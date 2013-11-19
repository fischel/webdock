
(function(App){

    var dbClient;
    var dbStore;
    var dbTable;

    var floppy = {};

    floppy.init = function() {
        var change;

        if (typeof Dropbox == 'undefined') {
            return;
        }

        // dropbox client
        dbClient = new Dropbox.Client({key: App.ram.data.floppy.key});
        dbClient.authenticate({interactive: true}, function (error, cl) {
            if (error) {
                alert('Authentication error: ' + error);
            }
        });
        if (dbClient.isAuthenticated()) {
            console.log('isAuthenticated');
            var datastoreManager = dbClient.getDatastoreManager();
            datastoreManager.openDefaultDatastore(function (error, datastore) {
                if (error) {
                    alert('Error opening default datastore: ' + error);
                } else {
                    dbStore = datastore;
                    dbTable = datastore.getTable('notes');
                    datastore.syncStatusChanged.addListener(floppy.status);

                    change = floppy.load(false);
                    if (change > 0) {
                        App.box.textLoad('Load(' + change + ')');
                    }
                    App.box.checkUnsaved();
                    App.box.statusLoad(true);
                    App.box.statusSave(true);
                }
            });
        }
    }

    floppy.load = function(saveData) {
        var t, found;
        var change = 0;

        if (dbTable == null) {
            return;
        }

        var elem;
        var results = dbTable.query({});
        var k = results.length;
        var foundIds = {};
        for (var t = 0; t < k; t++) {
            // save id
            foundIds[ results[t].getId() ] = true;

            // create elem
            elem = App.ram.create({
                id: results[t].getId(),
                version: results[t].get('version'),
                x: results[t].get('x'),
                y: results[t].get('y'),
                width: results[t].get('width'),
                height: results[t].get('height'),
                content: results[t].get('content'),
                created: results[t].get('created').getTime(),
                modified: results[t].get('modified').getTime()
            });

            found = App.ram.findById(results[t].getId());
            if (found == null) {
                change++;
                console.log('dbLoad: add');
                if (saveData) {
                    App.ram.add(elem);
                    App.box.add(elem);
                }
            } else {
                // console.log(elem.content);
                console.log('dbLoad: found: ' + found.version + '=' + elem.version);
                if (found.version < elem.version) {
                    change++;
                    if (saveData) {
                        found.version = results[t].get('version');
                        found.x = results[t].get('x');
                        found.y = results[t].get('y');
                        found.width = results[t].get('width');
                        found.height = results[t].get('height');
                        found.content = results[t].get('content');
                        App.box.refreshNote(found);
                    }
                }
            }
        }
        // check for delete
        for (t = 0; t < App.ram.data.notes.length; t++) {
            elem = App.ram.data.notes[t];
            if (!foundIds.hasOwnProperty(elem.id)) {
                console.log('dbLoad: delete');
                change++;
                if (saveData) {
                    App.box.delete(elem);
                }
            }
        }

        App.ram.save();
        if (saveData) {
            App.box.textLoad('Load');
        }
        return change;
    }

    floppy.save = function() {
        var t, elem, found, saveObj;

        if (dbTable == null) {
            return;
        }

        for (t = 0; t < App.ram.data.notes.length; t++) {
            elem = App.ram.data.notes[t];
            saveObj = {
                version: elem.version,
                x: elem.x,
                y: elem.y,
                width: elem.width,
                height: elem.height,
                content: elem.content,
                created: new Date(elem.created),
                modified: new Date(elem.modified)
            };
            if (elem.id) {
                console.log('save: update');
                found = dbTable.get(elem.id);
                if (found) {
                    if (elem.changed) {
                        elem.version++;
                        saveObj.version++;
                    }
                    found.update(saveObj);
                } else {
                    elem.id = null;
                }

            }
            if (elem.id == null) {
                console.log('save: insert');
                found = dbTable.insert(saveObj);
                elem.id = found.getId();
            }
            elem.changed = false;
        }

        // delete unsused
        var results = dbTable.query({});
        for (var t = 0; t < results.length; t++) {
            found = App.ram.findById(results[t].getId());
            if (found == null) {
                console.log('dbLoad: delete');
                results[t].deleteRecord();
            }
        }

        App.ram.data.deleted = [];
        App.ram.save();
        App.box.checkUnsaved();
    }

    floppy.status = function() {
        if (dbStore.getSyncStatus().uploading) {
            App.box.statusSave(false);
        } else {
            App.box.statusSave(true);
        }
    }

    App.floppy = floppy;

})(App)
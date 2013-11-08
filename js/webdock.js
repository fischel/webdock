
/*
 * webdock.js
 *
 * Copyright 2013, Stephan Fischer - http://fischel.org/
 * Released under the MIT Licence
 * http://opensource.org/licenses/MIT
 *
 * Github:  http://github.com/fischel/webdock/
 * Version: 1.0
 */

var App = window.App = {
    ram: null,    // storage for localstore
    floppy: null, // save data to external
    box: null     // vm
};

window.onload = function() {
    App.ram.init();
    ko.applyBindings(App.box);
}

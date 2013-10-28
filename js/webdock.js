
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

var App = window.App = {};

window.onload = function() {
    App.store.init();
    ko.applyBindings(App.vm);
}

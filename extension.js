/* -*- mode: js2; js2-basic-offset: 4; indent-tabs-mode: nil -*- */
//
// Title: windowsearch@line72.net
// Version: 0.0.1
// File: extension.js
// Description: Gnome shell extension to search through active windows.
//  Search is done by application name and window title and integrates
//  nicely into the search display
// Todo: Add live previews of windows and optimize
//
// Copyright (C) 2011 - Marcus Dillavou <line72@line72.net>
//
// This program is free software; you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation; either version 2, or (at your option)
// any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program; if not, write to the Free Software
// Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA 02110-1301  USA.

const St = imports.gi.St;
const Mainloop = imports.mainloop;
const Gettext = imports.gettext.domain('gnome-shell');
const _ = Gettext.gettext;
const Shell = imports.gi.Shell;

const Main = imports.ui.main;
const Search = imports.ui.search;

function WindowSearchProvider() {
    this._init();
}

WindowSearchProvider.prototype = {
    __proto__: Search.SearchProvider.prototype,

    _init: function() {
        Search.SearchProvider.prototype._init.call(this, _("WINDOWS"));
    },

    getResultMeta: function(resultId) {
        let apps = this.getRunningApps();

        for (let i = 0; i < apps.length; i++) {
            let app = apps[i];
            let windows = app.get_windows();

            for (let j = 0; j < windows.length; j++) {
                let window = windows[j];

                let title = app.get_name() + ' - ' + window.get_title();

                if (resultId == title) {
                    return { 'id': resultId,
                             'name': window.get_title(),
                             'createIcon': function(size) {
                                 return app.create_icon_texture(size);
                             }
                           };
                }
            }
        }

        // !mwd - should never get here!
        return { 'id': resultId,
                 'name': resultId,
                 'createIcon': function(size) {
                     return null;
                 }
               };

    },

    activateResult: function(id, params) {
        let apps = this.getRunningApps();

        for (let i = 0; i < apps.length; i++) {
            let app = apps[i];
            let windows = app.get_windows();

            for (let j = 0; j < windows.length; j++) {
                let window = windows[j];

                let title = app.get_name() + ' - ' + window.get_title();
                
                if (id == title) {
                    // !mwd - we do this manually instead of calling
                    //  Main.activateWindow(window) because activateWindow
                    //  toggles the overview when it shouldn't and causes
                    //  weird focus and keyboard issues
                    //Main.activateWindow(window);

                    let activeWorkspaceNum = global.screen.get_active_workspace_index();
                    let windowWorkspaceNum = window.get_workspace().index();

                    time = global.get_current_time();

                    if (windowWorkspaceNum != activeWorkspaceNum) {
                        let workspace = global.screen.get_workspace_by_index(windowWorkspaceNum);
                        workspace.activate_with_focus(window, time);
                    } else {
                        window.activate(time);
                    }
                }
            }
        }
    },

    getInitialResultSet: function(terms) {
        let results = [];

        let apps = this.getRunningApps();

        terms = terms.map(String.toLowerCase);

        if (!apps.length)
            return results;

        for (let i = 0; i < apps.length; i++) {
            let app = apps[i];
            let windows = app.get_windows();

            for (let j = 0; j < windows.length; j++) {
                let window = windows[j];

                let mtype = Search.MatchType.NONE;

                let title = app.get_name() + ' - ' + window.get_title();
                let titleLower = String.toLowerCase(title);

                for (let k = 0; k < terms.length; k++) {
                    let idx = titleLower.indexOf(terms[k]);
                    if (idx == 0) {
                        mtype = Search.MatchType.PREFIX;
                    } else if (idx > 0) {
                        if (mtype == Search.MatchType.NONE)
                            mtype = Search.MatchType.SUBSTRING;
                    } else {
                        mtype = Search.MatchType.NONE;
                        break;
                    }
                }
                if (mtype != Search.MatchType.NONE) {
                    results.push(title);
                }
            }

        }

        return results;
    },

    getSubsearchResultSet: function(previousResults, terms) {
        //!mwd - not too effecient here!
        return this.getInitialResultSet(terms);
    },

    getRunningApps: function() {
        return Shell.AppSystem.get_default().get_running();
    }
};

let searchProvider;

function init(extensionMeta) {
    searchProvider = new WindowSearchProvider();
}

function enable() {
    Main.overview._viewSelector.addSearchProvider(searchProvider);
}

function disable() {
    Main.overview._viewSelector.removeSearchProvider(searchProvider);
}

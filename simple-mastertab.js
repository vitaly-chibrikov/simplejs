/*
 Only one master per all tabs is allowed.
 If master tab is closed, rest of the tabs "decide" who is new master.
 If mastertab_stop() was called, no one tab is master.

 Example:

    <script src="simple-local-events-broadcast.js"></script>
    <script src="simple-mastertab.js"></script>
    <script>
        function init(){
            mastertab_start();

            document.getElementById("IsMaster").innerHTML = mastertab_tryMaster();

            mastertab_subscribe(function(event){
                document.getElementById("IsMaster").innerHTML = event;
            });
        }

        function stop(){
            mastertab_stop(); //stops mastertab in all tabs
        }
    </script>
 */

;(function () {
    "use strict";

    var MasterTab = {
        //private
        MASTER_CHANGED_EVENT_NAME: "master_tab_master_changed_event",
        MASTER_LEFT_EVENT_NAME: "master_tab_master_left_event",
        SHUTDOWN_EVENT_NAME: "master_tab_shutdown_event",
        TAB_ID_NAME: "master_tab_id",
        MASTER_ID_NAME: "master_tab_master_id",

        OBSOLETE_MASTER_PERIOD: 3600000,
        TRY_MASTER_DELAY: 50,

        tabId: null,

        //public
        start: function () {
            MasterTab.dropMasterIfObsolete();
            MasterTab.tabId = MasterTab.getTabId();
            window.onunload = MasterTab.onUnload;
            LocalEventsBroadcast.subscribe(MasterTab.MASTER_LEFT_EVENT_NAME, function (event) {
                MasterTab.tryMaster();
            });
            LocalEventsBroadcast.subscribe(MasterTab.SHUTDOWN_EVENT_NAME, function (event) {
                LocalEventsBroadcast.unsubscribe(MasterTab.MASTER_LEFT_EVENT_NAME);
            });
        },

        //public
        isMaster: function () {
            var masterTabId = localStorage.getItem(MasterTab.MASTER_ID_NAME);
            var id = MasterTab.getIdFromLocalStorage();
            return id === MasterTab.tabId;
        },

        //public
        tryMaster: function () {
            var masterTabId = localStorage.getItem(MasterTab.MASTER_ID_NAME);
            if (!masterTabId) {
                var currentTime = new Date().getTime();
                var toStore = JSON.stringify({'tabId': MasterTab.tabId, 'time': currentTime});
                localStorage.setItem(MasterTab.MASTER_ID_NAME, toStore);

                clearTimeout(MasterTab.isMasterHandle);
                MasterTab.isMasterHandle = setTimeout(function () {
                    var id = MasterTab.getIdFromLocalStorage();
                    var isMaster = (id === MasterTab.tabId);
                    LocalEventsBroadcast.dispatch(MasterTab.MASTER_CHANGED_EVENT_NAME, isMaster);
                }, MasterTab.TRY_MASTER_DELAY);

                return false;
            } else {
                return MasterTab.isMaster();
            }
        },

        //public
        stop: function () {
            LocalEventsBroadcast.dispatchGlobal(MasterTab.SHUTDOWN_EVENT_NAME, ".");
            localStorage.removeItem(MasterTab.MASTER_ID_NAME);
        },

        //public
        subscribe: function (callback) {
            LocalEventsBroadcast.subscribe(MasterTab.MASTER_CHANGED_EVENT_NAME, callback);
        },

        //public
        unsubscribe: function (callback) {
            LocalEventsBroadcast.unsubscribe(MasterTab.MASTER_CHANGED_EVENT_NAME);
        },

        //private
        reset: function () {
            localStorage.removeItem(MasterTab.MASTER_ID_NAME);
            LocalEventsBroadcast.dispatchGlobal(MasterTab.MASTER_LEFT_EVENT_NAME, ".");
        },

        //private
        getIdFromLocalStorage: function () {
            var masterTabId = localStorage.getItem(MasterTab.MASTER_ID_NAME);
            return JSON.parse(masterTabId).tabId;
        },

        //private
        dropMasterIfObsolete: function () {
            var masterTabId = localStorage.getItem(MasterTab.MASTER_ID_NAME);
            if (masterTabId) {
                var currentTime = new Date().getTime();
                var masterTime = JSON.parse(masterTabId).time;
                var timeToObsolete = currentTime - masterTime;
                if (timeToObsolete > MasterTab.OBSOLETE_MASTER_PERIOD) {
                    console.log("Master is obsolete");
                    MasterTab.reset();
                }
            }
        },

        //private
        getTabId: function () {
            var id = sessionStorage.getItem(MasterTab.TAB_ID_NAME);
            if (!id) {
                var rand = Math.floor(Math.random() * 1000);
                var currentTime = new Date().getTime().toString();
                id = "KH-" + currentTime + "-" + rand;
                sessionStorage.setItem(MasterTab.TAB_ID_NAME, id);
            }
            return id;
        },

        //private
        onUnload: function () {
            if (MasterTab.isMaster()) {
                MasterTab.reset();
            }
        },
    }

    //expose

    window.mastertab_start = MasterTab.start;
    window.mastertab_isMaster = MasterTab.isMaster;
    window.mastertab_tryMaster = MasterTab.tryMaster;
    window.mastertab_stop = MasterTab.stop;
    window.mastertab_subscribe = MasterTab.subscribe;
    window.mastertab_unsubscribe = MasterTab.unsubscribe;
})();
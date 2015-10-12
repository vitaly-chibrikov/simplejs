/*
 Only one master per all tabs is allowed.
 If master tab is closed, rest of the tabs "decide" who is new master.
 Example:

    <script src="simple-local-events-broadcast.js"></script>
    <script src="simple-master-slave.js"></script>
    <script>
        function init(){
        document.getElementById("IsMaster").innerHTML = MasterSlaveIsMaster();

        LocalEventsBroadcast.subscribe(MasterSlave.MASTER_CHANGED_EVENT_NAME, function(event){
            document.getElementById("IsMaster").innerHTML = event;
        });
    }
    </script>
 */

;(function () {

    var MasterSlave = {
        //public
        MASTER_CHANGED_EVENT_NAME: "master_slave_master_changed_event",
        MASTER_LEFT_EVENT_NAME: "master_slave_master_left_event",

        //private
        TAB_ID_NAME: "master_slave_tab_id",
        MASTER_ID_NAME: "master_slave_master_id",
        RESET_MASTER_PERIOD: 3600000,
        TRY_MASTER_DELAY: 50,

        tabId: null,

        //public
        isMaster: function () {
            var masterTabId = localStorage.getItem(MasterSlave.MASTER_ID_NAME);
            if (!masterTabId) {
                var currentTime = new Date().getTime();
                var toStore = JSON.stringify({'tabId': MasterSlave.tabId, 'time': currentTime});
                localStorage.setItem(MasterSlave.MASTER_ID_NAME, toStore);

                clearTimeout(MasterSlave.isMasterHandle);
                MasterSlave.isMasterHandle = setTimeout(function () {
                    var id = MasterSlave.getIdFromLocalStorage();
                    var isMaster = (id === MasterSlave.tabId);
                    LocalEventsBroadcast.dispatch(MasterSlave.MASTER_CHANGED_EVENT_NAME, isMaster);
                }, MasterSlave.TRY_MASTER_DELAY);

                return false;
            } else {
                masterTabId = localStorage.getItem(MasterSlave.MASTER_ID_NAME);
                var id = MasterSlave.getIdFromLocalStorage();
                return id === MasterSlave.tabId;
            }
        },

        //private
        getIdFromLocalStorage: function () {
            var masterTabId = localStorage.getItem(MasterSlave.MASTER_ID_NAME);
            return JSON.parse(masterTabId).tabId;
        },

        //private
        init: function () {
            this.dropMasterIfObsolete();
            this.tabId = this.getTabId();
            window.onbeforeunload = this.onBeforeUnload;
            LocalEventsBroadcast.subscribe(MasterSlave.MASTER_LEFT_EVENT_NAME, function (event) {
                MasterSlave.isMaster();
            });
        },

        //private
        dropMasterIfObsolete: function () {
            var masterTabId = localStorage.getItem(MasterSlave.MASTER_ID_NAME);
            if (masterTabId) {
                var currentTime = new Date().getTime();
                var masterTime = JSON.parse(masterTabId).time;
                var timeToObsolete = currentTime - masterTime;
                if (timeToObsolete > MasterSlave.RESET_MASTER_PERIOD) {
                    console.log("Master is obsolete");
                    localStorage.removeItem(MasterSlave.MASTER_ID_NAME);
                    LocalEventsBroadcast.dispatchGlobal(MasterSlave.MASTER_LEFT_EVENT_NAME, ".");
                }
            }
        },

        //private
        getTabId: function () {
            var id = sessionStorage.getItem(MasterSlave.TAB_ID_NAME);
            if (!id) {
                var rand = Math.floor(Math.random() * 1000);
                var currentTime = new Date().getTime().toString();
                id = "KH-" + currentTime + "-" + rand;
                sessionStorage.setItem(MasterSlave.TAB_ID_NAME, id);
            }
            return id;
        },

        //private
        onBeforeUnload: function () {
            if (MasterSlave.isMaster()) {
                localStorage.removeItem(MasterSlave.MASTER_ID_NAME);
                LocalEventsBroadcast.dispatchGlobal(MasterSlave.MASTER_LEFT_EVENT_NAME, ".");
            }
        },
    }

    //expose
    window.MasterSlaveIsMaster = MasterSlave.isMaster;
    window.MASTER_CHANGED_EVENT_NAME = MasterSlave.MASTER_CHANGED_EVENT_NAME;
    window.MASTER_LEFT_EVENT_NAME = MasterSlave.MASTER_LEFT_EVENT_NAME;

    MasterSlave.init();
})();
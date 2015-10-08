/*
    Only one master per all tabs allowed.
    If master tab is closed all tabs "decide" who is new master.
    Example:

        <script src="local_events_broadcast.js"></script>
        <script src="master_slave.js"></script>
        <script>
             function init(){
                LocalEventsBroadcast.init();
                MasterSlave.init();

                document.getElementById("IsMaster").innerHTML = MasterSlave.isMaster();
                document.getElementById("TabId").innerHTML = MasterSlave.tabId;

                LocalEventsBroadcast.subscribe(MasterSlave.MASTER_CHANGED_EVENT_NAME, function(event){
                    document.getElementById("IsMaster").innerHTML = event;
                });
            }
        </script>
*/

var MasterSlave = {
    TAB_ID_NAME: "master_slave_tab_id",
    MASTER_ID_NAME: "master_slave_master_id",
    MASTER_LEFT_EVENT_NAME: "master_slave_master_left_event",
    MASTER_CHANGED_EVENT_NAME: "master_slave_master_changed_event",
    RESET_MASTER_PERIOD: 60000,
    tabId: null,

    init: function(){
        this.dropMasterIfObsolete();
        this.tabId = this.getTabId();
        window.onbeforeunload = this.onBeforeUnload;
        LocalEventsBroadcast.subscribe(MasterSlave.MASTER_LEFT_EVENT_NAME, function(event){
            MasterSlave.tryMaster();
        });
    },

    tryMaster: function(){
        var timeToWait = Math.floor(Math.random() * 100);
        setTimeout(function(){
            var isMaster = MasterSlave.isMaster();
            LocalEventsBroadcast.dispatch(MasterSlave.MASTER_CHANGED_EVENT_NAME, isMaster);
        }, timeToWait);
    },

    isMaster: function(){
        var masterTabId = localStorage.getItem(MasterSlave.MASTER_ID_NAME);
        if(!masterTabId){
            var currentTime = new Date().getTime();
            var toStore = JSON.stringify({'tabId': this.tabId, 'time': currentTime});
            localStorage.setItem(MasterSlave.MASTER_ID_NAME, toStore);
            return true;
        } else {
            id = JSON.parse(masterTabId).tabId;
            return id == this.tabId;
        }
        return this.isMaster;
    },

    dropMasterIfObsolete: function(){
         var masterTabId = localStorage.getItem(MasterSlave.MASTER_ID_NAME);
         if(masterTabId){
            var currentTime = new Date().getTime();
            var masterTime = JSON.parse(masterTabId).time;
            var timeToObsolete = currentTime - masterTime;
            if(timeToObsolete > MasterSlave.RESET_MASTER_PERIOD){
                console.log("Master is obsolete");
                localStorage.removeItem(MasterSlave.MASTER_ID_NAME);
                LocalEventsBroadcast.dispatchGlobal(MasterSlave.MASTER_LEFT_EVENT_NAME, ".");
            }
         }
    },

    getTabId: function(){
        var id = sessionStorage.getItem(MasterSlave.TAB_ID_NAME);
        if(!id){
            var rand = Math.floor(Math.random() * 1000);
            var currentTime = new Date().getTime().toString();
            id = "KH-" + currentTime + "-" + rand;
            sessionStorage.setItem(MasterSlave.TAB_ID_NAME, id);
        }
        return id;
    },

    onBeforeUnload: function(){
        if(MasterSlave.isMaster()){
            localStorage.removeItem(MasterSlave.MASTER_ID_NAME);
            LocalEventsBroadcast.dispatchGlobal(MasterSlave.MASTER_LEFT_EVENT_NAME, ".");
        }
    },

}
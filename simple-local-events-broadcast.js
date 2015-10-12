/*
    Transport of events over the localStorage changes.
    Example:

        <script src="simple-local-events-broadcast.js"></script>
        <script>
            function init(){
                LocalEventsBroadcast.subscribe("test", function(event){
                    console.log(JSON.stringify(event));
                });

                LocalEventsBroadcast.dispatch("test", "Hello from the same tab.");
                LocalEventsBroadcast.dispatchGlobal("test", "Hello from the different tab.");
            }
        </script>
*/

;(function () {

    var LocalEventsBroadcast = {
        //send event to subscribers of the same window
        dispatch: function (name, data) {
            var event = new CustomEvent(name, {'detail': data});
            window.dispatchEvent(event);
        },

        //subscribe to all events from the same tab and from others
        subscribe: function (name, callback) {
            window.addEventListener(name, function (event) {
                callback(event.detail);
            }, false);
        },

        //send event to subscribers in another tabs
        dispatchGlobal: function (name, data) {
            var currentTime = new Date().getTime().toString();
            localStorage.setItem(name, JSON.stringify({'time': currentTime, 'detail': data}));
        }
    };

    //subscribe to events from other tabs
    window.addEventListener('storage', function (lsEvent) {
        if (lsEvent.storageArea === localStorage) {
            var name = lsEvent.key;
            var newValue = lsEvent.newValue;
            if (newValue != null) {
                var data = JSON.parse(newValue);
                LocalEventsBroadcast.dispatch(name, data.detail);
            }
        }
    }, false);

    //expose the object
    window.LocalEventsBroadcast = LocalEventsBroadcast;
})();
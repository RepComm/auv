
//TODO - Compression on streamer client side, and decompression on listener client side
//https://github.com/jpemartins/speex.js/blob/master/src/encoder.js
//https://github.com/jpemartins/speex.js/blob/master/src/decoder.js
//https://github.com/jpemartins/speex.js/blob/master/src/codec.js

class ReconnectingClient {
    constructor() {
        this.socket = undefined;
        this.url = undefined;
        this.protocols = undefined;

        this.reconnectTimeout = 1000;
        this.reconnectTimeoutId = undefined;
        this.reconnectCount = 0;
        this.reconnectMaxTries = 5;
    }
    connect() {
        this.disconnect();
        this.socket = new WebSocket(this.url, this.protocols);
        this.socket.addEventListener("close", (e) => this.onClose(e));
        this.socket.addEventListener("error", (e) => this.onError(e));
        this.socket.addEventListener("message", (e) => this.onData(e));
        this.socket.addEventListener("open", (e) => this.onOpen(e));
    }
    setUrl(url) {
        this.url = url;
    }
    disconnect(code = undefined, reason = undefined) {
        if (this.socket) {
            if (this.socket.readyState === WebSocket.CONNECTING ||
                this.socket.readyState === WebSocket.OPEN) {
                this.socket.close(code, reason);
            }
            this.socket = undefined;
        }
        if (this.reconnectTimeoutId) {
            clearTimeout(this.reconnectTimeoutId);
            this.reconnectTimeoutId = undefined;
        }
    }
    onClose(e) {
        switch (e.code) {
            case 1000:
                console.log("Normal connection closure, not reconnecting");
                break;
            case 1001:
                console.log("Server going away, or navigation of browser, not reconnecting");
                break;
            default:
                if (this.reconnectCount > this.reconnectMaxTries - 1) {
                    console.log("Couldn't not reconnect, max tries used. Aborting.");
                    this.disconnect();
                    return;
                }
                console.log(
                    "Connection closed, trying to reconnect in ~",
                    (this.reconnectTimeout / 1000).toFixed(2),
                    "seconds",
                    this.reconnectCount + 1,
                    "of",
                    this.reconnectMaxTries,
                    "used"
                );

                this.reconnectTimeoutId = setTimeout(() => {
                    this.reconnectCount++;
                    this.connect();
                }, this.reconnectTimeout);
                break;
        }
    }
    onError(e) {
        //console.log(e);
    }
    onData(e) {
        console.log(e);
    }
    onOpen(e) {
        console.log(e);
    }
    send(data) {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            console.log("Sending", data);
            this.socket.send(data);
        }
    }
}

let elem = (id) => document.getElementById(id);
let on = (e, type, cb) => e.addEventListener(type, cb);

let btnMic = elem("btnMic");
let btnConnect = elem("btnConnect");
let spnTitle = elem("spnTitle");
let spnDesc = elem("spnDesc");

let rc = new ReconnectingClient();
rc.setUrl("ws://localhost:5001");
rc.onOpen = () => {
    btnConnect.classList.remove("toggleOff");
    rc.send(JSON.stringify({
        listening:true
    }));
    on(rc.socket, "close", (e) => {
        btnConnect.classList.add("toggleOff");
    });
}
rc.onData = (e) => {
    let json = JSON.parse(e.data);
    console.log("Server sent", json);
    if (json.title) {
        spnTitle.innerText = json.title;
    }
    if (json.desc) {
        spnDesc.innerText = json.desc;
    }
}
rc.connect();

on(btnMic, "mousedown", () => {
    if (btnMic.classList.contains("toggleOff")) {
        btnMic.classList.remove("toggleOff");

        rc.send(JSON.stringify({
            listening:true //Send doesn't do anything when not connected
        }));
    } else {
        btnMic.classList.add("toggleOff");
        rc.send(JSON.stringify({
            listening:false //Send doesn't do anything when not connected
        }));
    }
});

on(btnConnect, "mousedown", () => {
    if (btnConnect.classList.contains("toggleOff")) {
        btnConnect.classList.remove("toggleOff");
        rc.connect();
    } else {
        btnConnect.classList.add("toggleOff");
        rc.disconnect(1000); //Disconnect normally (1000)
    }
});

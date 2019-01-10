
let protoSettings = undefined;

fetch("./protocol.json").then((response)=>{
    response.json().then((json)=>{
        protoSettings = json;
    });
});
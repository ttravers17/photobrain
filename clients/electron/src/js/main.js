const { ipcRenderer, remote } = require('electron')
const WebSocket = require('ws')
const WEBSOCKET_PORT = remote.getGlobal('process').env.WEBSOCKET_PORT
const ws = new WebSocket(`ws://localhost:${WEBSOCKET_PORT}`, {
    perMessageDeflate: false
});

let DATASTORE = {
    CURRENT_IMAGE: {
        buffer: new Uint8Array(),
        mimetype: 'image/jpeg',
        dataURL: '',
        uploaded: false
    },
    CURRENT_TRANSFORM: {
        buffer: new Uint8Array(),
        mimetype: 'image/jpeg',
        dataURL: ''
    }
}


window.onload = function () {
    // Grab all interactive elements
    const uploadBtn = document.getElementById("upload-btn")
    const uploadImage = document.getElementById("upload-image")
    const transformedImage = document.getElementById('transformed-image')
    const saveBtn = document.getElementById('save-btn')
    const transformBtn = document.getElementById('transform-btn')

    // When message received update transform data and render image
    ws.on('message', async (data) => {
        console.log("Message received from websocket server", data)
        const mimetype = 'image/jpeg'
        const dataURL = await bufferToBase64(data, mimetype);

        if (!dataURL) {
            alert("An error occured processing image transform")
            return;
        }

        DATASTORE.CURRENT_TRANSFORM.buffer = data
        DATASTORE.CURRENT_TRANSFORM.mimetype = mimetype
        DATASTORE.CURRENT_TRANSFORM.dataURL = dataURL

        transformedImage.src = dataURL
    })

    // Upload button handles populating image and setting data to be sent
    uploadBtn.addEventListener('click', () => {
        // Tell process to open filesystem
        ipcRenderer.send('openFile')

        // User uploaded a file, process it
        ipcRenderer.on('fileData', async (event, { data, mimetype }) => {
            // turn the buffer into base64 string
            const dataURL = await bufferToBase64(data, mimetype);
            if (!dataURL) {
                alert("An error occured processing image transform")
                return;
            }

            // Set our datastore to be used by transform
            DATASTORE.CURRENT_IMAGE.buffer = data
            DATASTORE.CURRENT_IMAGE.mimetype = mimetype
            DATASTORE.CURRENT_IMAGE.dataURL = dataURL
            DATASTORE.CURRENT_IMAGE.uploaded = true

            // render image
            uploadImage.src = dataURL
        })
    })

    // Send transform to server/model for processing
    transformBtn.addEventListener('click', async () => {
        if (DATASTORE.CURRENT_IMAGE.uploaded) {
            ws.send(DATASTORE.CURRENT_IMAGE.buffer);
        }
    });


    function blobToDataURL(blob) {
        return new Promise((fulfill, reject) => {
            let reader = new FileReader();
            reader.onerror = reject;
            reader.onload = (e) => fulfill(reader.result);
            reader.readAsDataURL(blob);
        })
    }

    function bufferToBase64(data, mimetype) {
        let blob = new Blob([data], { type: mimetype })

        return blobToDataURL(blob).catch((e) => {
            console.error('An error occured constructing image url from byte array', e)
            return ""
        })
    }
}
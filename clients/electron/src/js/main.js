const { ipcRenderer, remote } = require('electron')
const WebSocket = require('ws')
const WEBSOCKET_PORT = remote.getGlobal('process').env.WEBSOCKET_PORT
const ws = new WebSocket(`ws://localhost:${WEBSOCKET_PORT}`, {
    perMessageDeflate: false
});

let DATASTORE = {
    TRANSFORM: '',
    TRANSFORM_LENGTH: 60,
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
    const transformsContainer = document.getElementById('transforms-container')
    // get reference to input elements in toppings container element
    let transforms = transformsContainer.getElementsByTagName('input');
    registerTransformClickHandlers(transforms)



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

            // Data is a uint array, we need to decorate this with empty data
            var dataPadded = new Uint8Array(DATASTORE.TRANSFORM_LENGTH + data.length)
            // transform_length start of array is 0s
            dataPadded.set(data, DATASTORE.TRANSFORM_LENGTH)

            // Set our datastore to be used by transform
            DATASTORE.CURRENT_IMAGE.buffer = dataPadded
            DATASTORE.CURRENT_IMAGE.mimetype = mimetype
            DATASTORE.CURRENT_IMAGE.dataURL = dataURL
            DATASTORE.CURRENT_IMAGE.uploaded = true

            // render image
            uploadImage.src = dataURL
        })
    })

    // Send transform to server/model for processing
    transformBtn.addEventListener('click', async () => {
        if (DATASTORE.CURRENT_IMAGE.uploaded && DATASTORE.TRANSFORM) {
            // clear out previous buffer metadata before writing new
            zeroOut(DATASTORE.CURRENT_IMAGE.buffer, DATASTORE.TRANSFORM_LENGTH)
            // copy over transform string as ascii characters to image buffer
            for (let i = 0; i < DATASTORE.TRANSFORM.length; i++) {
                DATASTORE.CURRENT_IMAGE.buffer[i] = DATASTORE.TRANSFORM.charCodeAt(i)
            }

            ws.send(DATASTORE.CURRENT_IMAGE.buffer);
        }
    });

    function zeroOut(buffer, size, offset = 0) {
        for (let i = 0; i < size; i++) {
            buffer[i] = 0;
        }
    }

    function registerTransformClickHandlers(transformEls) {
        for (let i = 0; i < transformEls.length; i++) {
            if (transformEls[i].type === 'radio') {
                transformEls[i].addEventListener('click', ({ srcElement }) => {
                    DATASTORE.TRANSFORM = srcElement.value;
                });
            }
        }
    }

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
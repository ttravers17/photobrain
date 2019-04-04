const { ipcRenderer, remote } = require('electron')
const WebSocket = require('ws')
const WEBSOCKET_PORT = remote.getGlobal('process').env.WEBSOCKET_PORT
const ws = new WebSocket(`ws://localhost:${WEBSOCKET_PORT}`, {
    perMessageDeflate: false
});


window.onload = function () {
    const uploadBtn = document.getElementById("upload-btn")
    const uploadImage = document.getElementById("upload-image")
    const transformedImage = document.getElementById('transformed-image')
    const saveBtn = document.getElementById('save-btn')
    const transformBtn = document.getElementById('transform-btn')

    ws.on('message', async (data) => {
        console.log("Message received from websocket server", data)
        // const dataURL = await blobToDataURL(new Blob([data], { type: 'image/jpg' })).catch(e => {
        //     console.error("Error occured inr eceiver", e);
        // })
        let blob = new Blob([data], { type: 'image/jpg' });
        const dataURL = await blobToDataURL(blob).catch(console.error)


        transformedImage.src = dataURL
    })

    uploadBtn.addEventListener('click', () => {
        ipcRenderer.send('openFile')


        ipcRenderer.on('fileData', async (event, fileData) => {
            let blob = new Blob([fileData.data], { type: fileData.mimetype })

            const dataURL = await blobToDataURL(blob).catch((e) => {
                alert('An error occured constructing image url from byte array', dataURL)
                return ""
            })

            uploadImage.src = dataURL

            ws.send(fileData.data)

        })
    })

    transformBtn.addEventListener('click', () => {
        console.log("transform btn clicked")

        const transform = 'crop';
        const dataURI = transform + ',' + uploadImage.src;

        ws.send(dataURI, (e) => {
            console.error("Error occured sending data", e)
        })

    });


    function blobToDataURL(blob) {
        return new Promise((fulfill, reject) => {
            let reader = new FileReader();
            reader.onerror = reject;
            reader.onload = (e) => fulfill(reader.result);
            reader.readAsDataURL(blob);
        })
    }
}
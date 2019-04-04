const { ipcRenderer } = require('electron')

window.onload = function () {

    const uploadBtn = document.getElementById("upload-btn")
    const uploadImage = document.getElementById("upload-image")


    uploadBtn.addEventListener('click', () => {
        ipcRenderer.send('openFile')


        ipcRenderer.on('fileData', async (event, fileData) => {
            let blob = new Blob([fileData.data], { type: fileData.mimetype })

            const dataURL = await blobToDataURL(blob).catch((e) => {
                alert('An error occured constructing image url from byte array', dataURL)
                return ""
            })

            uploadImage.src = dataURL
        })
    })


    function blobToDataURL(blob) {
        return new Promise((fulfill, reject) => {
            let reader = new FileReader();
            reader.onerror = reject;
            reader.onload = (e) => fulfill(reader.result);
            reader.readAsDataURL(blob);
        })
    }
}
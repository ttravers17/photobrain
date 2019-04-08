const { app, BrowserWindow, ipcMain } = require('electron')

const path = require('path')
const url = require('url')

let window = null

// Load all environment variables on application startup
require('dotenv').config({
    path: path.join(__dirname, '..', '..', '.env')
})

main();

function main() {
    // Wait until the app is ready
    app.once('ready', createWindow)
    // Handle uploading images
    ipcMain.on('openFile', handleOpenFile)
}



function createWindow() {
    window = new BrowserWindow({
        minHeight: 600,
        minWidth: 800,
        backgroundColor: "#D6D8DC",
        show: false,
    });

    window.loadURL(url.format({
        pathname: path.join(__dirname, 'index.html'),
        protocol: 'file:',
        slashes: true
    }))

    window.once('ready-to-show', () => { window.show() })
}


function handleOpenFile(event, path) {
    const { dialog } = require('electron')
    const fs = require('fs')

    const options = {}
    options.filters = [{ name: 'Images', extensions: ['jpg', 'png'] }]
    options.properties = ['openFile']

    const filesnames = dialog.showOpenDialog(options, (filenames) => {
        if (!filenames || !Array.isArray(filenames) || filenames.length === 0) {
            return
        }

        const filepath = filenames[0]
        const index = filepath.lastIndexOf('.')
        const extension = filepath.slice(index + 1)

        const data = fs.readFileSync(filepath)

        event.sender.send('fileData', {
            data: data,
            mimetype: `image/${extension}`
        })
    })
}

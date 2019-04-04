const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const url = require('url')

let window = null

// Load all environment variables on application startup
require('dotenv').config({
    path: path.join(__dirname, '..', '..', '.env')
})


let client_ws = require('./client');

client_ws.on('open', () => {
    client_ws.send("Hello from main")
})

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


ipcMain.on('openFile', (event, path) => {
    const { dialog } = require('electron')
    const fs = require('fs')

    dialog.showOpenDialog(
        {
            filters: [
                { name: 'Images', extensions: ['jpg', 'png'] },
            ],
            properties: ['openFile']
        },
        (filenames) => {
            if (!filenames || filenames.length === 0) {
                return
            }

            const filepath = filenames[0]

            // read the file here
            fs.readFile(filepath, (err, data) => {
                if (err) {
                    alert(`An error occured reading the file: ${err.message}`)
                    return
                }

                // Grab the image type as metadata
                index = filepath.lastIndexOf('.')
                extension = filepath.slice(index + 1)

                // Send over byte array and mimetype
                event.sender.send('fileData', {
                    data: data,
                    mimetype: `image/${extension}`
                })
            })
        }
    );
})


// Wait until the app is ready
app.once('ready', createWindow)
const { app, BrowserWindow } = require('electron')

function createWindow () {
	win = new BrowserWindow({ width: 1200, height: 800, backgroundColor: '#2e2c29' })
	win.on('closed', () => {
		win = null
	})
	win.loadURL('https://e-contract.io')
}

app.on('ready', createWindow)

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		app.quit()
	}
})

app.on('activate', () => {
	if (win === null) {
		createWindow()
	}
})
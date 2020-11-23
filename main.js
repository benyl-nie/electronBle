const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const dataStore = require('./renderer/musicDataStore');
// const { scan } =  require('./renderer/bluetooth')
// const noble = require('noble');

app.allowRendererProcessReuse = true;
// app.commandLine.appendSwitch('enable-web-bluetooth', true);

let currentDeviceList = [];


const myStore = new dataStore({'name': 'Music Data'});

class AppWindow extends BrowserWindow{
  constructor(config, url){
    const basicConfig = {
      width: 900,
      height: 800,
      webPreferences: {
        nodeIntegration: true
      }
    };
    const finalWindow = {...basicConfig, ...config};
    // finalWindow.webContents.openDevTools();
    super(finalWindow);
    this.loadFile(url);
    this.once('ready-to-show', () => {
      this.show();
    });
  }
};

app.commandLine.appendSwitch("enable-web-bluetooth", true);

app.on('ready', () => {
  const mainWindow = new AppWindow({}, './renderer/index.html');
  
  mainWindow.webContents.openDevTools();
  mainWindow.webContents.on('did-finish-load', () => {
    console.log('load in main');
    mainWindow.send('getTracks', myStore.getTracks());
  });


  const content = mainWindow.webContents;
  content.on('select-bluetooth-device', (event, deviceList, callback) => {
    event.preventDefault();
    deviceList.forEach(device => {
      if (currentDeviceList.find(item => item.deviceId == device.deviceId)) return;
      currentDeviceList.push(device);
      if (currentDeviceList.length > 3) {
        console.log('Device list:', currentDeviceList);
        // Display the device list in a window.
        content.send('display-ble-device', currentDeviceList);
        callback('');
      }
    })
  });

  ipcMain.on('delete-music', (event, id) => {
    const updateTracks = myStore.deleteTracks(id).getTracks();
    mainWindow.send('getTracks', updateTracks);
  });

  ipcMain.on('add-music-window', (event, arg) => {

    const addWindow = new AppWindow({
      width: 700,
      height: 300,
      parent: mainWindow
    }, './renderer/add.html');
    
    ipcMain.on('select-music-window', (event, arg) => {
      dialog.showOpenDialog({
        properties: ['openFile', 'multiSelections'],
        filters: [{name: 'Music', extensions: ['mp3']}]
      })
      .then(files => {
        if(files) {
          event.sender.send('selected-file', files);
        }
      })
    });

    // 导入文件
    ipcMain.on('add-tracks', (event, tracks) => {
      const updateTracks = myStore.addTracks(tracks).getTracks();
      console.log(updateTracks);
      mainWindow.send('getTracks', updateTracks);
    });

    // 
  });

  ipcMain.on('scanner-bluetooth', (event, args) => {
    // Bluetooth.requestDevice(options).then(function(res) {
    //   console.log('scanner res', res);
    // })
    // noble.on('stateChange', scan);
  })
})



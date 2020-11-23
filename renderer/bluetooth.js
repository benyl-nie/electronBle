// const { ipcRenderer } = require('electron');
// const { $ } = require('./helper');

// $('scanner').addEventListener('click', function() {
//   ipcRenderer.send('scanner-bluetooth');
// })
const noble = require('noble');
exports.scan = function() {
  if (state === 'poweredOn') {
    noble.startScanning();
    console.log("Started scanning");
  } else {
    noble.stopScanning();
    console.log("Is Bluetooth on?");
  }
}
const { ipcRenderer } = require('electron');
const { $, convertDuration } = require('./helper');

let musicAudio = new Audio();
let allTracks;
let currentTrack;



$('add-music').addEventListener('click',function() {
  ipcRenderer.send('add-music-window');
})

$('discover').addEventListener('click', function() {
  scanDevices();
  $('scanner').innerHTML = '';
  console.log('开始扫描');
})



const renderListHtml = (tracks) => {
  const tracksList = $('tracksList');
  const tracksListHtml = tracks.reduce((html, track) => {
    console.log('track in render', track);
    html += `<li class='row music-track list-group-item d-flex justify-content-between align-item-center'>
              <div class='col-10'>
                <img src='./asstes/music.png' class='mr-2' width='22px'>
                <b>${track.filename}</b>
              </div>
              <div class='col-2'>
                <img src='./asstes/play.png'  width='20px' data-id="${track.id}" class='play'>
                <img src='./asstes/delete.png' width='20px' data-id="${track.id}" class='trash'>
              </div>
            </li>`
    return html;
  },'');
  const empty = `<div class='alert alert-primary'>还没有添加任何音乐</div>`;
  tracksList.innerHTML = tracks.length ? `<ul class='list-group'>${tracksListHtml}</ul>` : empty; 
}

ipcRenderer.on('getTracks', (event, tracks) => {
  console.log('receive tracks', tracks);
  allTracks = tracks;
  renderListHtml(tracks);
});

$('tracksList').addEventListener('click', (e) => {
  e.preventDefault();
  const { dataset, classList } = e.target;
  const id = dataset && dataset.id;
  if (id && classList.contains('play')) {
    // play
    if (currentTrack && currentTrack.id === id) {
      musicAudio.play();
    } else {
      currentTrack = allTracks.find(item => item.id === id);
      musicAudio.src = currentTrack.path;
      musicAudio.play();
      // reset icon
      const resetIconEle = document.querySelector('.pause');
      if (resetIconEle) {
        resetIconEle.classList.replace('pause', 'play');
        resetIconEle.src = './asstes/play.png';
      }
    }
    e.target.src = './asstes/pause.png';
    classList.replace('play', 'pause');
  } else if (id && classList.contains('pause')) {
    // pause
    musicAudio.pause();
    e.target.src = './asstes/play.png';
    classList.replace('pause', 'play')
  } else if (id && classList.contains('trash')) {
    // delete
    ipcRenderer.send('delete-music', id);
  }
});


const renderPlayerHtml = (name, duration) => {
  const player = $('player-status');
  const html = `<div class='col font-weight-bold'>正在播放:${name}</div>
                <div class='col'>
                  <span id='current-seeker'>00:00</span> / ${convertDuration(duration)}
                </div>`;
  player.innerHTML = html;
}

const updateProgresHtml = (currentTime, duration) => {
  const seeker = $('current-seeker');
  seeker.innerHTML = convertDuration(currentTime);

  const progress = `${(currentTime /duration * 100).toFixed(2)}%`;
  const progressbar = $('player-progress');
  progressbar.innerHTML = progress;
  progressbar.style.width = progress;
}

musicAudio.addEventListener('loadedmetadata', () => {
  renderPlayerHtml(currentTrack.filename, musicAudio.duration);
});

musicAudio.addEventListener('timeupdate', () => {
  updateProgresHtml(musicAudio.currentTime, musicAudio.duration);
})

// 监听主进程返回的消息
ipcRenderer.on('display-ble-device', function (event, arg) {
  console.log('render device list:', arg);
  var table = document.body.querySelector('#scanner');
  arg.forEach(device => {
      var li = document.createElement('li');
      li.innerHTML = `name:${device.deviceName} id:${device.deviceId}`
      table.appendChild(li)
  });
  // alert(arg);
});

const serviceUUID = 0x1234;
/**filters是一个过滤BLE设备的数组，形式为：
 *[
     { services: [filterService] },
     { name: filterName },
     { namePrefix: filterNamePrefix }
  ]
 */
function buildMachineFilter() {
  let filters = [{
		services: [serviceUUID]
	}];
  return filters;
}

function scanDevices() {
  let options = {};
  // options.filters = buildMachineFilter();
  options.acceptAllDevices = true;
  options.optionalServices = [serviceUUID]
  
  console.log('Requesting Bluetooth Device...');
  let device = navigator
      .bluetooth
      .requestDevice(options)
      .then(device => {
          console.log('> Name:             ' + device.name);
          console.log('> Id:               ' + device.id);
          console.log('> Initially, connected?        ' + device.gatt.connected);
          return device.gatt.connect();
      })
      .catch(error => {
          console.log('Argh! ' + error);
      });
}



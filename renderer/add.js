const { ipcRenderer } = require('electron');
const { $ } = require('./helper');
const path = require('path');

let musicFilePath = [];

$('select-music').addEventListener('click', () => {
  ipcRenderer.send('select-music-window');
});

$('add-music').addEventListener('click', () => {
  ipcRenderer.send('add-tracks', musicFilePath);
});


const renderListHtml = (pathes) => {
  const musicList = $('musicList');
  const listHtml = pathes.reduce((html, music) => {
    html += `<li class='list-group-item'>${path.basename(music)}</li>`;
    return html;
  }, '');
  musicList.innerHTML =  `<ul class='list-group'>${listHtml}</ul>`;
}

ipcRenderer.on('selected-file', (event, path) => {
  if (Array.isArray(path.filePaths)) {
    renderListHtml(path.filePaths);
    musicFilePath = path.filePaths;
  }
})




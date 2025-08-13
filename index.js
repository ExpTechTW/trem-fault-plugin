const path = require("path");
const { ipcRenderer } = require("electron");
const fs = require("fs");
const faultPath = path.join(__dirname, 'resource', 'fault.json');

class Plugin {
  static instance = null;
  #ctx;
  constructor(ctx) {
    if (Plugin.instance) return Plugin.instance;
    this.#ctx = ctx;
    this.name = "more-station-info";
    this.logger = null;
    Plugin.instance = this;
  }

  static getInstance() {
    if (!Plugin.instance) throw new Error("Plugin not initialized");
    return Plugin.instance;
  }

  onLoad() {
    const { TREM, logger, info, utils } = this.#ctx;
    const event = (event, callback) => TREM.variable.events.on(event, callback);

    event("MapLoad", (map) => {
      map.addSource('fault', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      map.addLayer({
        id: 'fault',
        type: 'line',
        source: 'fault',
        paint: {
          'line-color': '#ff0000',
          'line-width': 2
        }
      },'rts-layer');
      fs.readFile(faultPath, 'utf8', (err, data) => {
        if (err) {
          logger.error('斷層資料載入失敗', err);
          return;
        }
        const faultGeoJson = JSON.parse(data);
        map.getSource('fault').setData(faultGeoJson);
      });
    });
  }
}

module.exports = Plugin;
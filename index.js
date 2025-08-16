const config  = require("../config/config");
const path = require("path");
const fs = require("fs");
const faultPath = path.join(__dirname, 'resource', 'fault.json');

class Plugin {
  static instance = null;
  #ctx;
  #config;
  constructor(ctx) {
    if (Plugin.instance) return Plugin.instance;
    this.#ctx = ctx;
    this.#config = null;
    this.logger = null;
    this.getconfig = () => void 0;
    Plugin.instance = this;
  }

  static getInstance() {
    if (!Plugin.instance) throw new Error("Plugin not initialized");
    return Plugin.instance;
  }

  onLoad() {
    const { TREM, logger, info, utils } = this.#ctx;
    const event = (event, callback) => TREM.variable.events.on(event, callback);
    const defaultDir = utils.path.join(info.pluginDir, "./fault/resource/default.yml");
    const configDir = utils.path.join(info.pluginDir, "./fault/config.yml");
    this.#config = new config("fault", this.logger, utils.fs, defaultDir, configDir);
    this.getConfig = this.#config.getConfig;
    const faultConfig = this.#config.getConfig();

    event("MapLoad", (map) => {
      const CoverLayers = ['rts-layer', 'report-markers'];
      let beforeLayer;
      for (let i = CoverLayers.length - 1; i >= 0; i--) {
        if (map.getLayer(CoverLayers[i])) {
          beforeLayer = CoverLayers[i];
          break;
        }
      }
      map.addSource('fault', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      map.addLayer({
        id: 'fault',
        type: 'line',
        source: 'fault',
        paint: {
          'line-color': `${faultConfig.color}`,
          'line-width': `${faultConfig.width}`
        }
      },beforeLayer);
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
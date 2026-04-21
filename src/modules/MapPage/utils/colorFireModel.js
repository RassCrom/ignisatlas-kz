import Style from 'ol/style/Style';
import Stroke from 'ol/style/Stroke';
import Fill from "ol/style/Fill";

export function styleFireModelFunction(feature, resolution) {
    let style;
    let dn = feature.get('dn');
    const opacity = 0.3;  // Константа для прозрачности

    if (dn < 1) {
        style = [new Style({
        fill: new Fill({
            color: `rgba(255, 0, 0, ${opacity})`  // Темно-красный
        }),
        stroke: new Stroke({
            color: 'rgba(255, 0, 0, 1)',
            width: 1
        })
        })];
    } else if (dn < 2) {
        style = [new Style({
        fill: new Fill({
            color: `rgba(255, 25, 25, ${opacity})`  // Красный с градиентом
        }),
        stroke: new Stroke({
            color: 'rgba(255, 25, 25, 1)',
            width: 1
        })
        })];
    } else if (dn < 3) {
        style = [new Style({
        fill: new Fill({
            color: `rgba(255, 51, 51, ${opacity})`  // Красный
        }),
        stroke: new Stroke({
            color: 'rgba(255, 51, 51, 1)',
            width: 1
        })
        })];
    } else if (dn < 4) {
        style = [new Style({
        fill: new Fill({
            color: `rgba(255, 77, 51, ${opacity})`  // Красно-оранжевый
        }),
        stroke: new Stroke({
            color: 'rgba(255, 77, 51, 1)',
            width: 1
        })
        })];
    } else if (dn < 5) {
        style = [new Style({
        fill: new Fill({
            color: `rgba(255, 102, 51, ${opacity})`  // Оранжевый
        }),
        stroke: new Stroke({
            color: 'rgba(255, 102, 51, 1)',
            width: 1
        })
        })];
    } else if (dn < 6) {
        style = [new Style({
        fill: new Fill({
            color: `rgba(255, 128, 51, ${opacity})`  // Светло-оранжевый
        }),
        stroke: new Stroke({
            color: 'rgba(255, 128, 51, 1)',
            width: 1
        })
        })];
    } else if (dn < 7) {
        style = [new Style({
        fill: new Fill({
            color: `rgba(255, 153, 51, ${opacity})`  // Оранжево-жёлтый
        }),
        stroke: new Stroke({
            color: 'rgba(255, 153, 51, 1)',
            width: 1
        })
        })];
    } else if (dn < 8) {
        style = [new Style({
        fill: new Fill({
            color: `rgba(255, 179, 51, ${opacity})`  // Жёлто-оранжевый
        }),
        stroke: new Stroke({
            color: 'rgba(255, 179, 51, 1)',
            width: 1
        })
        })];
    } else if (dn < 9) {
        style = [new Style({
        fill: new Fill({
            color: `rgba(255, 204, 51, ${opacity})`  // Жёлтый
        }),
        stroke: new Stroke({
            color: 'rgba(255, 204, 51, 1)',
            width: 1
        })
        })];
    } else if (dn < 10) {
        style = [new Style({
        fill: new Fill({
            color: `rgba(237, 229, 51, ${opacity})`  // Светло-жёлтый
        }),
        stroke: new Stroke({
            color: 'rgba(237, 229, 51, 1)',
            width: 1
        })
        })];
    } else if (dn < 11) {
        style = [new Style({
        fill: new Fill({
            color: `rgba(220, 255, 51, ${opacity})`  // Желтовато-зелёный
        }),
        stroke: new Stroke({
            color: 'rgba(220, 255, 51, 1)',
            width: 1
        })
        })];
    } else if (dn < 12) {
        style = [new Style({
        fill: new Fill({
            color: `rgba(190, 255, 51, ${opacity})`  // Лаймово-зелёный
        }),
        stroke: new Stroke({
            color: 'rgba(190, 255, 51, 1)',
            width: 1
        })
        })];
    } else if (dn < 13) {
        style = [new Style({
        fill: new Fill({
            color: `rgba(165, 255, 135, ${opacity})`  // Зелёный
        }),
        stroke: new Stroke({
            color: 'rgba(165, 255, 135, 1)',
            width: 1
        })
        })];
    } else if (dn < 14) {
        style = [new Style({
        fill: new Fill({
            color: `rgba(135, 255, 165, ${opacity})`  // Светло-зелёный
        }),
        stroke: new Stroke({
            color: 'rgba(135, 255, 165, 1)',
            width: 1
        })
        })];
    } else if (dn < 15) {
        style = [new Style({
        fill: new Fill({
            color: `rgba(51, 255, 254, ${opacity})`  // Голубой
        }),
        stroke: new Stroke({
            color: 'rgba(51, 255, 254, 1)',
            width: 1
        })
        })];
    } else if (dn < 17) {
        style = [new Style({
        fill: new Fill({
            color: `rgba(97, 189, 255, ${opacity})`  // Светло-голубой
        }),
        stroke: new Stroke({
            color: 'rgba(97, 189, 255, 1)',
            width: 1
        })
        })];
    } else if (dn < 19) {
        style = [new Style({
        fill: new Fill({
            color: `rgba(94, 129, 255, ${opacity})`  // Синий
        }),
        stroke: new Stroke({
            color: 'rgba(94, 129, 255, 1)',
            width: 1
        })
        })];
    } else if (dn < 22) {
        style = [new Style({
        fill: new Fill({
            color: `rgba(50, 51, 255, ${opacity})`  // Тёмно-синий
        }),
        stroke: new Stroke({
            color: 'rgba(50, 51, 255, 1)',
            width: 1
        })
        })];
    } else if (dn < 24) {
        style = [new Style({
        fill: new Fill({
            color: `rgba(25, 0, 128, ${opacity})`  // Глубокий синий
        }),
        stroke: new Stroke({
            color: 'rgba(25, 0, 128, 1)',
            width: 1
        })
        })];
    } else {
        style = [new Style({
        fill: new Fill({
            color: `rgba(0, 0, 0, ${opacity})`  // Чёрный
        }),
        stroke: new Stroke({
            color: 'rgba(0, 0, 0, 1)',
            width: 1
        })
        })];
    }
        
    return style;
}
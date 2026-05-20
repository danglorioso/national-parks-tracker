import L from 'leaflet';

export const createCustomIcon = (color: string) => {  
  return L.divIcon({
    className: 'custom-div-icon',
    html: `
      <div style="
        width: 20px;
        height: 20px;
        background-color: ${color};
        border: 2px solid white;
        border-radius: 50%;
        box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
      "></div>
    `,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
};

export const markerIcons = {
  visited: createCustomIcon('#16a34a'), // green-600
  notVisited: createCustomIcon('#d1d5db'), // gray-300
  bucketList: createCustomIcon('#facc15'), // yellow-400
};
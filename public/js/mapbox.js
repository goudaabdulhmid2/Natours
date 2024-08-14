export const displayMap = (locations) => {
  mapboxgl.accessToken =
    'pk.eyJ1IjoiZ291ZGFhYmR1bGhtaWQyIiwiYSI6ImNsemwzZWRpajB3ZTIyaXIwcWt2M2I1M20ifQ.sMA19qswXHjNVQSVNKpnkA';
  const map = new mapboxgl.Map({
    container: 'map', // container ID
    style: 'mapbox://styles/goudaabdulhmid2/clzl5iu3i003501pdhap48jnf', // style URL
    //   center: [35, -32],
    //   zoom: 10,
    //   interactive: false,
    scrollZoom: false,
  });

  const bounds = new mapboxgl.LngLatBounds();

  locations.forEach((loc) => {
    // create marker
    const el = document.createElement('div');

    el.className = 'marker';

    // Add marker
    new mapboxgl.Marker({
      element: el,
      anchor: 'bottom',
    })
      .setLngLat(loc.coordinates)
      .addTo(map);

    //Add popup
    new mapboxgl.Popup({
      offset: 30,
    })
      .setLngLat(loc.coordinates)
      .setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`)
      .addTo(map);

    // Extend map bounds to icludes current location
    bounds.extend(loc.coordinates);
  });

  map.fitBounds(bounds, {
    padding: {
      top: 200,
      bottom: 150,
      left: 100,
      right: 100,
    },
  });
};

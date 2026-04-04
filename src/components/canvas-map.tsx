"use client";

import dynamic from "next/dynamic";
import Map from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";

function CanvasMapInner() {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  if (!token) {
    return <div className="h-full w-full bg-[#EDE9E1]" />;
  }

  return (
    <Map
      initialViewState={{ longitude: 20, latitude: 25, zoom: 1.5 }}
      style={{ width: "100%", height: "100%" }}
      mapStyle="mapbox://styles/mapbox/light-v11"
      mapboxAccessToken={token}
      interactive={false}
      attributionControl={false}
    />
  );
}

const CanvasMapDynamic = dynamic(() => Promise.resolve(CanvasMapInner), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-[#EDE9E1]" />,
});

export function CanvasMap() {
  return <CanvasMapDynamic />;
}

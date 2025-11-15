"use client";

import * as React from "react";
import * as d3 from "d3";
import { Feature, FeatureCollection, GeoJsonProperties, Geometry } from "geojson";
import geoData from "@/public/it.json";

interface RegionSVGProps {
  regione: string;
  lat: number;
  lon: number;
  width?: number;
  height?: number;
}

export default function RegionSVG({regione, lat, lon, width = 100, height = 100,}: RegionSVGProps) {
  const svgRef = React.useRef<SVGSVGElement>(null);

  React.useEffect(() => {
    if (!geoData || !svgRef.current) return;

    // 1️⃣ Trova la feature della regione
    const regionFeature = geoData.features.find(
      (f) => f.properties?.name?.toLowerCase() === regione.toLowerCase()
    ) as Feature<Geometry, GeoJsonProperties> | undefined;

    if (!regionFeature) {
      console.error(`Regione non trovata: ${regione}`);
      return;
    }

    // 2️⃣ Crea la proiezione e il path generator
    const projection = d3.geoMercator().fitSize([width, height], regionFeature);
    const pathGenerator = d3.geoPath().projection(projection);


    // 3️⃣ Pulisci SVG
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const pathData = pathGenerator(regionFeature);
    // 4️⃣ Disegna la sagoma della regione
    svg
      .append("path")
      .attr("d", pathGenerator(regionFeature) || "")
      .attr("fill", "#9CB6C1")
      .attr("stroke", "#2D5158")
      .attr("stroke-width", 1.5);

    // 5️⃣ Aggiungi il punto
    const projected = projection([lon, lat]);
    if (projected) {
      const [x, y] = projected;
      svg
        .append("circle")
        .attr("cx", x)
        .attr("cy", y)
        .attr("r", 5)
        .attr("fill", "#A2582B")
        .attr("stroke", "white")
        .attr("stroke-width", 1.5);
    } else {
      console.error("Projection failed.");
    }

  }, [regione, lat, lon, width, height]);

  return <svg ref={svgRef} width={width} height={height}></svg>;
}

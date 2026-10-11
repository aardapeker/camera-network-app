import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import type { LoginAttempt } from "~/types";
import { useMemo, useState, useEffect, memo } from "react";
import { useTranslation } from "react-i18next";
import { GEO_HEATMAP_COLORS } from "~/constants/colors";

type GeographicDistributionChartProps = {
  loginAttempts: LoginAttempt[];
};

// Simplified world map topology (using TopoJSON converted to GeoJSON)
// This fetches from a CDN and caches it
const WORLD_MAP_URL =
  "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

type CountryGeometry = {
  type: string;
  id: string;
  properties: {
    name: string;
  };
  geometry: {
    type: string;
    coordinates: number[][][] | number[][][][];
  };
};

// Turkish cities and their regions for more granular display
const TURKEY_CITY_REGIONS: Record<string, string> = {
  Istanbul: "Istanbul (Marmara)",
  Maltepe: "Istanbul / Maltepe (Marmara)",
  Ankara: "Ankara (Central Anatolia)",
  Bursa: "Bursa (Marmara)",
  Van: "Van (Eastern Anatolia)",
  Izmir: "İzmir (Aegean)",
  Antalya: "Antalya (Mediterranean)",
  Adana: "Adana (Mediterranean)",
  Konya: "Konya (Central Anatolia)",
  Gaziantep: "Gaziantep (Southeastern Anatolia)",
  Mersin: "Mersin (Mediterranean)",
  Diyarbakir: "Diyarbakır (Southeastern Anatolia)",
  Kayseri: "Kayseri (Central Anatolia)",
  Eskisehir: "Eskişehir (Central Anatolia)",
  Trabzon: "Trabzon (Black Sea)",
  Samsun: "Samsun (Black Sea)",
  Erzurum: "Erzurum (Eastern Anatolia)",
};

// Helper function to extract country from location string
function extractCountryFromLocation(location: string): string {
  if (!location || location === "Unknown" || location === "Local Network") return "Unknown";

  const parts = location.split(",").map((p) => p.trim());
  const country = parts[parts.length - 1];

  // Normalize common country name variations
  const countryMap: Record<string, string> = {
    // United States variations
    USA: "United States of America",
    US: "United States of America",
    "United States": "United States of America",

    // United Kingdom variations
    UK: "United Kingdom",
    "Great Britain": "United Kingdom",

    // Other variations
    UAE: "United Arab Emirates",
    Korea: "South Korea",
    "Republic of Korea": "South Korea",
    "Democratic Republic of the Congo": "Dem. Rep. Congo",
    "Dominican Republic": "Dominican Rep.",
    "Central African Republic": "Central African Rep.",
    "Equatorial Guinea": "Eq. Guinea",
    "Bosnia and Herzegovina": "Bosnia and Herz.",
    "Solomon Islands": "Solomon Is.",

    // Turkey/Türkiye - normalize to what the map uses
    Turkey: "Turkey",
    Türkiye: "Turkey",
  };

  return countryMap[country] || country;
}

// For the top locations list — returns a human-friendly label with Turkish region info
function extractLocationLabel(location: string): string {
  if (!location || location === "Unknown" || location === "Local Network") return "Unknown";

  const parts = location.split(",").map((p) => p.trim());
  const city = parts[0];
  const country = extractCountryFromLocation(location);

  if (country === "Turkey") {
    return TURKEY_CITY_REGIONS[city] ?? `${city} (Turkey)`;
  }

  return location;
}

// Simple projection (Equirectangular)
function projectPoint(
  lon: number,
  lat: number,
  width: number,
  height: number,
): [number, number] {
  const x = (lon + 180) * (width / 360);
  const y = (90 - lat) * (height / 180);
  return [x, y];
}

// Convert GeoJSON coordinates to SVG path
function coordinatesToPath(
  coordinates: number[][] | number[][][] | number[][][][],
  width: number,
  height: number,
  isMultiPolygon = false,
): string {
  const paths: string[] = [];

  const processPolygon = (polygon: number[][]) => {
    const points = polygon.map(([lon, lat]) =>
      projectPoint(lon, lat, width, height),
    );
    if (points.length === 0) return "";

    let path = `M ${points[0][0]} ${points[0][1]}`;
    for (let i = 1; i < points.length; i++) {
      path += ` L ${points[i][0]} ${points[i][1]}`;
    }
    path += " Z";
    return path;
  };

  if (isMultiPolygon) {
    (coordinates as number[][][][]).forEach((polygon) => {
      polygon.forEach((ring) => {
        const path = processPolygon(ring);
        if (path) paths.push(path);
      });
    });
  } else {
    (coordinates as number[][][]).forEach((ring) => {
      const path = processPolygon(ring);
      if (path) paths.push(path);
    });
  }

  return paths.join(" ");
}

type CountryPathProps = {
  countryName: string;
  count: number;
  d: string;
  fill: string;
  opacity: number;
  hasData: boolean;
  onHover: (name: string | null) => void;
};

const CountryPath = memo(function CountryPath({
  countryName,
  count,
  d,
  fill,
  opacity,
  hasData,
  onHover,
}: CountryPathProps) {
  const { t } = useTranslation();
  return (
    <path
      d={d}
      fill={fill}
      opacity={opacity}
      stroke="var(--foreground)"
      strokeWidth="0.5"
      className="transition-opacity duration-200 hover:opacity-100"
      style={{ cursor: hasData ? "pointer" : "default" }}
      onMouseEnter={() => onHover(countryName)}
      onMouseLeave={() => onHover(null)}
    >
      <title>
        {countryName}: {t("analytics.geoAttemptsCount", { count })}
      </title>
    </path>
  );
});

export function GeographicDistributionChart({
  loginAttempts,
}: GeographicDistributionChartProps) {
  const { t } = useTranslation();
  const [mapData, setMapData] = useState<CountryGeometry[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);

  // Fetch world map data
  useEffect(() => {
    fetch(
      "https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson",
    )
      .then((res) => res.json())
      .then((geoJson) => {
        setMapData(geoJson.features);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  const loginStats = useMemo(() => {
    if (!loginAttempts || loginAttempts.length === 0) {
      return {
        countryData: {} as Record<string, number>,
        locationLabels: {} as Record<string, string>,
        maxCount: 0,
        totalAttempts: 0,
        topLocations: [],
      };
    }

    const countryCounts: Record<string, number> = {};
    // Track label per city for the top locations list
    const cityLabels: Record<string, string> = {};
    const cityCounts: Record<string, number> = {};

    loginAttempts.forEach((attempt) => {
      // Filter out local network entries
      if (!attempt.location || attempt.location === "Local Network, Local Network") return;

      const country = extractCountryFromLocation(attempt.location);
      if (country === "Unknown") return;

      countryCounts[country] = (countryCounts[country] || 0) + 1;

      const label = extractLocationLabel(attempt.location);
      cityLabels[label] = country;
      cityCounts[label] = (cityCounts[label] || 0) + 1;
    });

    const maxCount = Math.max(0, ...Object.values(countryCounts));
    const totalAttempts = Object.values(countryCounts).reduce((a, b) => a + b, 0);

    const topLocations = Object.entries(cityCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([label, count]) => ({
        country: label,
        count,
        percentage: ((count / totalAttempts) * 100).toFixed(1),
      }));

    return {
      countryData: countryCounts,
      locationLabels: cityLabels,
      maxCount,
      totalAttempts,
      topLocations,
    };
  }, [loginAttempts]);

  const { countryData, maxCount, totalAttempts, topLocations } = loginStats;

  const width = 1000;
  const height = 500;

  // Pre-compute SVG path strings for all countries (expensive coordinate projection)
  const countryPaths = useMemo(() => {
    const paths: Record<string, string> = {};
    for (const country of mapData) {
      const isMultiPolygon = country.geometry.type === "MultiPolygon";
      paths[country.id || country.properties.name] = coordinatesToPath(
        country.geometry.coordinates,
        width,
        height,
        isMultiPolygon,
      );
    }
    return paths;
  }, [mapData]);

  // Pre-compute color/opacity per country once when data changes, not on every render
  const countryStyles = useMemo(() => {
    const styles: Record<string, { fill: string; opacity: number; hasData: boolean }> = {};
    for (const name of Object.keys(countryData)) {
      const count = countryData[name];
      const intensity = count / maxCount;
      let fill: string;
      if (intensity > 0.8) fill = GEO_HEATMAP_COLORS[5];
      else if (intensity > 0.6) fill = GEO_HEATMAP_COLORS[4];
      else if (intensity > 0.4) fill = GEO_HEATMAP_COLORS[3];
      else if (intensity > 0.2) fill = GEO_HEATMAP_COLORS[2];
      else if (intensity > 0.1) fill = GEO_HEATMAP_COLORS[1];
      else fill = GEO_HEATMAP_COLORS[0];
      styles[name] = { fill, opacity: 0.6 + intensity * 0.4, hasData: count > 0 };
    }
    return styles;
  }, [countryData, maxCount]);

  if (!loginAttempts || loginAttempts.length === 0) {
    return (
      <Card className="col-span-full">
        <CardHeader>
          <CardTitle>{t("analytics.geoTitle")}</CardTitle>
          <CardDescription>
            {t("analytics.geoEmptyDesc")}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[400px] text-muted-foreground">
          {t("analytics.geoNoData")}
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="col-span-full">
        <CardHeader>
          <CardTitle>{t("analytics.geoTitle")}</CardTitle>
          <CardDescription>
            {t("analytics.geoDesc", { count: totalAttempts })}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[400px] text-muted-foreground">
          {t("analytics.geoLoading")}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle>{t("analytics.geoTitle")}</CardTitle>
        <CardDescription>
          {t("analytics.geoDesc", { count: totalAttempts })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
          {/* Map */}
          <div className="lg:col-span-2">
            <div className="rounded-lg border bg-card overflow-hidden relative" style={{ contain: "layout paint" }}>
              <svg
                viewBox={`0 0 ${width} ${height}`}
                className="w-full h-auto"
                style={{ maxHeight: "500px", willChange: "auto" }}
              >
                <rect width={width} height={height} fill="var(--background)" />

                {mapData.map((country) => {
                  const countryName = country.properties.name;
                  const key = country.id || countryName;
                  const count = countryData[countryName] || 0;
                  const style = countryStyles[countryName];

                  return (
                    <CountryPath
                      key={key}
                      countryName={countryName}
                      count={count}
                      d={countryPaths[key] ?? ""}
                      fill={style?.fill ?? "var(--chart-1)"}
                      opacity={style?.opacity ?? 0.3}
                      hasData={style?.hasData ?? false}
                      onHover={setHoveredCountry}
                    />
                  );
                })}
              </svg>

              {/* Hover tooltip */}
              {hoveredCountry && countryData[hoveredCountry] && (
                <div className="absolute top-4 left-4 bg-popover border rounded-lg shadow-lg p-3 pointer-events-none">
                  <p className="font-semibold text-sm">{hoveredCountry}</p>
                  <p className="text-xs text-muted-foreground">
                    {t("analytics.geoAttemptsCount", { count: countryData[hoveredCountry] })}
                  </p>
                </div>
              )}
            </div>

            {/* Color Legend */}
            <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <span>{t("analytics.geoLow")}</span>
              <div className="flex gap-1">
                {GEO_HEATMAP_COLORS.map((color, i) => (
                  <div
                    key={i}
                    className="w-6 h-4 rounded"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <span>{t("analytics.geoHigh")}</span>
            </div>
          </div>

          {/* Top Locations List */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold mb-3">{t("analytics.geoTopLocations")}</h3>
            <div className="space-y-2 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
              {topLocations.map((location, index) => (
                <div
                  key={location.country}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-semibold shrink-0">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {location.country}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {location.percentage}%
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <p className="text-sm font-semibold">{location.count}</p>
                    <p className="text-xs text-muted-foreground">{t("analytics.attempts").toLowerCase()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

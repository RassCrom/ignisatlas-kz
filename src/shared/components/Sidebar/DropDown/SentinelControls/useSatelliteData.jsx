import { useCallback, useState } from "react";
import { OpenEO } from "@openeo/js-client";
import { DEFAULT_SATELLITE_INPUTS } from "../DropDownConstants";

export const useSatelliteData = () => {
  const [satelliteInputs, setSatelliteInputs] = useState(DEFAULT_SATELLITE_INPUTS);
  const [isLoading, setIsLoading] = useState(false);
  const [searchResult, setSearchResult] = useState(null);
  const [error, setError] = useState(null);

  const handleInputChange = useCallback((field, value) => {
    setSatelliteInputs(prev => ({ ...prev, [field]: value }));
  }, []);

  const fetchSatelliteData = useCallback(async (params) => {
    try {
      const con = await OpenEO.connect("https://earthengine.openeo.org");
      await con.authenticateBasic("group1", "test123");

      const bbox = {
        west:  parseFloat(params.west),
        south: parseFloat(params.south),
        east:  parseFloat(params.east),
        north: parseFloat(params.north),
      };

      const geometry = {
        type: "Polygon",
        coordinates: [[
          [bbox.west, bbox.north],
          [bbox.east, bbox.north],
          [bbox.east, bbox.south],
          [bbox.west, bbox.south],
          [bbox.west, bbox.north],
        ]],
      };

      const bands = params.bands.split(",").map(b => b.trim());
      const builder = await con.buildProcess();

      let datacube = builder.load_collection(
        params.collection,
        geometry,
        [params.startDate, params.endDate],
        bands
      );

      const reducer = function (data) { return this.max(data); };
      datacube = builder.reduce_dimension(datacube, reducer, "t");

      const scale = function (x) { return this.linear_scale_range(x, 0, 3000, 0, 255); };
      datacube = builder.apply(datacube, scale);
      datacube = builder.save_result(datacube, "PNG");

      const capabilities = con.capabilities();
      if (!capabilities.hasFeature("computeResult")) {
        throw new Error("Synchronous preview not supported by this backend");
      }

      const preview = await con.computeResult(datacube);
      const imagePath = URL.createObjectURL(preview.data);

      return {
        imagePath,
        metadata: {
          collection: params.collection,
          dateRange: `${params.startDate} to ${params.endDate}`,
          bands:     params.bands,
        },
      };
    } catch (err) {
      console.error("OpenEO processing error:", err);
      throw new Error("Failed to process satellite data: " + err.message);
    }
  }, []);

  const handleSearch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetchSatelliteData(satelliteInputs);
      setSearchResult(result);
    } catch (err) {
      console.error("Error searching satellite data:", err);
      setError(err.message || "Failed to search satellite data");
    } finally {
      setIsLoading(false);
    }
  }, [satelliteInputs, fetchSatelliteData]);

  const handleDownload = useCallback(() => {
    if (!searchResult?.imagePath) return;
    const a = document.createElement("a");
    a.href = searchResult.imagePath;
    a.download = `satellite_${satelliteInputs.collection.replace("/", "_")}_${satelliteInputs.startDate}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, [searchResult, satelliteInputs]);

  return { satelliteInputs, isLoading, searchResult, error, handleInputChange, handleSearch, handleDownload };
};

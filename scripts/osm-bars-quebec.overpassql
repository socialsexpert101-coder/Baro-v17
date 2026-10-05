[out:json][timeout:180];
area["ISO3166-2"="CA-QC"][boundary=administrative]->.qc;
(
  nwr(area.qc)["amenity"~"^(bar|pub|nightclub|biergarten)$"];
);
out center tags;

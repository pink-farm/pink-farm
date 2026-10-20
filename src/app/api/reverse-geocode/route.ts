import { NextResponse } from "next/server";
import { parseGeocodeCoordinates } from "@/lib/request-security.mjs";
import { logServerError } from "@/lib/server-log.mjs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const latInput = searchParams.get("lat");
  const lonInput = searchParams.get("lon");

  const coordinates = parseGeocodeCoordinates(latInput, lonInput);
  if (!coordinates) {
    return NextResponse.json({ error: "Latitude and longitude required" }, { status: 400 });
  }
  const { latitude, longitude } = coordinates;

  try {
    const locationIqKey = process.env.LOCATIONIQ_API_KEY;
    if (locationIqKey) {
      const locationIqUrl = new URL("https://us1.locationiq.com/v1/reverse");
      locationIqUrl.search = new URLSearchParams({
        key: locationIqKey,
        lat: String(latitude),
        lon: String(longitude),
        format: "json",
        addressdetails: "1",
        normalizeaddress: "1",
        normalizecity: "1",
        zoom: "18",
      }).toString();

      const locationIqRes = await fetch(locationIqUrl, {
        headers: { "Accept-Language": "en" },
        signal: AbortSignal.timeout(5000),
      });
      if (locationIqRes.ok) {
        const data = await locationIqRes.json();
        if (data?.address) {
          const addr = data.address;
          const road = addr.road || addr.pedestrian || addr.street || addr.residential || addr.footway || "";
          const houseNumber = addr.house_number || "";
          const building = addr.building && addr.building !== "yes" ? addr.building : (addr.amenity || addr.shop || "");
          const suburb = addr.suburb || addr.neighbourhood || addr.city_district || addr.quarter || addr.hamlet || "";
          const city = addr.city || addr.town || addr.village || addr.municipality || addr.state_district || addr.county || "";
          const state = addr.state || "";
          const pinCode = addr.postcode ? addr.postcode.replace(/\s+/g, "").slice(0, 6) : "";
          const streetAddress = [houseNumber, building, road].filter(Boolean).join(", ");

          // A locality-only result isn't enough for the required street field.
          // Try Nominatim before returning so it can fill a road when available.
          if (streetAddress) {
            return NextResponse.json({
              success: true,
              pinCode,
              city,
              state,
              addressLine1: streetAddress,
              addressLine2: [suburb, addr.village, addr.postcode_area].filter(Boolean).join(", "),
              hasStreetAddress: true,
              displayName: data.display_name,
            });
          }
        }
      }
    }

    const nominatimUrl = new URL("https://nominatim.openstreetmap.org/reverse");
    nominatimUrl.search = new URLSearchParams({
      lat: String(latitude),
      lon: String(longitude),
      format: "json",
      addressdetails: "1",
      // Request the most detailed street/building result Nominatim provides.
      zoom: "18",
    }).toString();

    // 1. Try OpenStreetMap Nominatim reverse geocoder
    const nominatimRes = await fetch(nominatimUrl, {
      headers: {
        "User-Agent": "PinkFarmECommerce/1.0 (wecare@pinkfarm.in)",
        "Accept-Language": "en",
      },
      signal: AbortSignal.timeout(5000),
    });

    if (nominatimRes.ok) {
      const data = await nominatimRes.json();
      if (data && data.address) {
        const addr = data.address;
        const road = addr.road || addr.pedestrian || addr.street || addr.residential || addr.footway || "";
        const houseNumber = addr.house_number || "";
        const building = addr.building && addr.building !== "yes" ? addr.building : (addr.amenity || addr.shop || "");
        const suburb = addr.suburb || addr.neighbourhood || addr.city_district || addr.quarter || addr.hamlet || "";
        const city = addr.city || addr.town || addr.village || addr.municipality || addr.state_district || addr.county || "";
        const state = addr.state || "";
        let pinCode = addr.postcode || "";

        // Standardize Indian 6-digit PIN code if formatted with space
        if (pinCode) {
          pinCode = pinCode.replace(/\s+/g, "").slice(0, 6);
        }

        // Only put actual house/building/street information in address line 1.
        // Village and neighborhood names belong in the area field.
        const streetAddress = [houseNumber, building, road].filter(Boolean).join(", ");
        const addressLine1 = streetAddress;
        const addressLine2 = [suburb, addr.village, addr.postcode_area].filter(Boolean).join(", ");

        return NextResponse.json({
          success: true,
          pinCode,
          city,
          state,
          addressLine1,
          addressLine2,
          hasStreetAddress: Boolean(streetAddress),
          displayName: data.display_name,
        });
      }
    }

    // 2. Fallback to BigDataCloud client geocoder
    const bdcUrl = new URL("https://api.bigdatacloud.net/data/reverse-geocode-client");
    bdcUrl.search = new URLSearchParams({ latitude: String(latitude), longitude: String(longitude), localityLanguage: "en" }).toString();
    const bdcRes = await fetch(bdcUrl, { signal: AbortSignal.timeout(5000) });
    if (bdcRes.ok) {
      const bdcData = await bdcRes.json();
      return NextResponse.json({
        success: true,
        pinCode: bdcData.postcode ? bdcData.postcode.replace(/\s+/g, "").slice(0, 6) : "",
        city: bdcData.city || bdcData.locality || "",
        state: bdcData.principalSubdivision || "",
        // BigDataCloud provides locality-level results, not house/street
        // addresses. Keep its locality in the area field.
        addressLine1: "",
        addressLine2: bdcData.locality || "",
        hasStreetAddress: false,
        displayName: `${bdcData.locality || ""}, ${bdcData.city || ""}, ${bdcData.principalSubdivision || ""}`,
      });
    }

    return NextResponse.json({ error: "Could not resolve address" }, { status: 404 });
  } catch (error) {
    logServerError("security.geocode.provider_failed", error);
    return NextResponse.json({ error: "Address lookup is temporarily unavailable." }, { status: 502 });
  }
}

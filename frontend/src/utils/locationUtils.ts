import kolhapurAreasData from '../../kolhapur_city_areas.json';

export interface KolhapurArea {
  id: string;
  name: string;
  pincode: string;
  type: string;
  coordinates: {
    lat: number;
    lon: number;
  };
}

export const kolhapurAreas: KolhapurArea[] = kolhapurAreasData.kolhapur_city_areas;

// Calculate distance between two coordinates using Haversine formula
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in kilometers
  return Math.round(distance * 100) / 100; // Round to 2 decimal places
};

// Find nearby areas within a certain radius (in km)
export const findNearbyAreas = (
  targetArea: KolhapurArea,
  maxDistance: number = 5
): KolhapurArea[] => {
  return kolhapurAreas.filter((area) => {
    if (area.id === targetArea.id) return true; // Include the target area itself
    const distance = calculateDistance(
      targetArea.coordinates.lat,
      targetArea.coordinates.lon,
      area.coordinates.lat,
      area.coordinates.lon
    );
    return distance <= maxDistance;
  });
};

// Get area by ID
export const getAreaById = (id: string): KolhapurArea | undefined => {
  return kolhapurAreas.find((area) => area.id === id);
};

// Get area by name
export const getAreaByName = (name: string): KolhapurArea | undefined => {
  return kolhapurAreas.find((area) => area.name === name);
};

// Sort areas by distance from a reference point
export const sortAreasByDistance = (
  referenceArea: KolhapurArea,
  areasToSort: KolhapurArea[]
): Array<KolhapurArea & { distance: number }> => {
  return areasToSort
    .map((area) => ({
      ...area,
      distance: calculateDistance(
        referenceArea.coordinates.lat,
        referenceArea.coordinates.lon,
        area.coordinates.lat,
        area.coordinates.lon
      ),
    }))
    .sort((a, b) => a.distance - b.distance);
};

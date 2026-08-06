const OSRM_BASE = 'https://router.project-osrm.org/route/v1/driving';

export interface RouteStep {
  instruction: string;
  distance: string;
  duration: string;
}

export interface RouteResult {
  coordinates: [number, number][];
  distance: string;
  duration: string;
  steps: RouteStep[];
}

function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

function formatDuration(seconds: number): string {
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

function decodeInstruction(step: any): string {
  const type = step.maneuver?.type || 'continue';
  const modifier = step.maneuver?.modifier || '';
  const name = step.name || '';

  const map: Record<string, string> = {
    'turn left': `Gira a la izquierda en ${name}`,
    'turn right': `Gira a la derecha en ${name}`,
    'turn slight left': `Gira ligeramente a la izquierda`,
    'turn slight right': `Gira ligeramente a la derecha`,
    'turn sharp left': `Gira cerrado a la izquierda`,
    'turn sharp right': `Gira cerrado a la derecha`,
    'continue': `Continua recto por ${name || 'la via'}`,
    'depart': `Sale de ${name || 'la ubicacion'}`,
    'arrive': `Llegaste a tu destino`,
    'roundabout': `Toma la rotonda`,
    'merge': `Incorporarse a ${name}`,
    'fork': `Mantente a la ${modifier === 'left' ? 'izquierda' : 'derecha'}`,
    'end of road': `Al final de la calle, gira a la ${modifier === 'left' ? 'izquierda' : 'derecha'}`,
    'ramp': `Toma la rampa ${modifier ? 'a la ' + (modifier === 'left' ? 'izquierda' : 'derecha') : ''}`,
  };

  const key = modifier ? `${type} ${modifier}` : type;
  return map[key] || `Continua por ${name || 'la via'}`;
}

export async function getRoute(
  originLat: number,
  originLng: number,
  destLat: number,
  destLng: number,
): Promise<RouteResult | null> {
  try {
    const url = `${OSRM_BASE}/${originLng},${originLat};${destLng},${destLat}?overview=full&geometries=geojson&steps=true&language=es`;
    const res = await fetch(url);
    if (!res.ok) return null;

    const data = await res.json();
    if (!data.routes || data.routes.length === 0) return null;

    const route = data.routes[0];
    const coords: [number, number][] = route.geometry.coordinates;
    const steps: RouteStep[] = route.legs[0].steps.map((s: any) => ({
      instruction: decodeInstruction(s),
      distance: formatDistance(s.distance),
      duration: formatDuration(s.duration),
    }));

    return {
      coordinates: coords,
      distance: formatDistance(route.distance),
      duration: formatDuration(route.duration),
      steps,
    };
  } catch {
    return null;
  }
}

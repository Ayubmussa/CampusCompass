
export type Hotspot = {
  pitch: number;
  yaw: number;
  target: string;
  text: string;
};

export type Location = {
  id: string;
  name: string;
  description: string;
  panoramaUrl: string;
  thumbnailUrl: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  connections: Hotspot[];
};


export const locations: Location[] = [
  {
    id: 'quad',
    name: 'Campus Quad',
    description: 'The central hub of campus life, a large grassy area for events and relaxation.',
    panoramaUrl: '/vecteezy_full-seamless-spherical-hdri-360-panorama-in-interior-work_22911185.jpg',
    thumbnailUrl: 'https://picsum.photos/seed/quad/400/300',
    coordinates: { lat: 34.0522, lng: -118.2437 },
    connections: [
        { pitch: -10, yaw: 120, target: 'library', text: 'Go to the Library' },
    ],
  },
  {
    id: 'library',
    name: 'Main Library',
    description: 'A quiet place for study, with a vast collection of books and digital resources.',
    panoramaUrl: '/vecteezy_full-seamless-spherical-hdri-360-panorama-in-interior-work_22911185.jpg',
    thumbnailUrl: 'https://picsum.photos/seed/library/400/300',
    coordinates: { lat: 34.0532, lng: -118.2447 },
    connections: [
        { pitch: -5, yaw: -45, target: 'quad', text: 'Back to the Quad' },
    ],
  },
  {
    id: 'student-union',
    name: 'Student Union',
    description: 'The heart of student activities, featuring dining options, lounges, and event spaces.',
    panoramaUrl: '/vecteezy_full-seamless-spherical-hdri-360-panorama-in-interior-work_22911185.jpg',
    thumbnailUrl: 'https://picsum.photos/seed/union/400/300',
    coordinates: { lat: 34.0512, lng: -118.2427 },
    connections: [],
  },
    {
    id: 'science-hall',
    name: 'Science Hall',
    description: 'Home to the science departments, with modern labs and lecture halls.',
    panoramaUrl: '/vecteezy_full-seamless-spherical-hdri-360-panorama-in-interior-work_22911185.jpg',
    thumbnailUrl: 'https://picsum.photos/seed/science/400/300',
    coordinates: { lat: 34.0542, lng: -118.2457 },
    connections: [],
  },
];

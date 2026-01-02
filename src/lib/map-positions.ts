/**
 * Map Position Configuration
 * 
 * This file maps location names to their positions on each map page.
 * Positions are specified as percentages (0-100) of the map image dimensions.
 * 
 * To add a location:
 * 1. Find the location on the map image
 * 2. Estimate its position as a percentage:
 *    - x: 0 = left edge, 50 = center, 100 = right edge
 *    - y: 0 = top edge, 50 = center, 100 = bottom edge
 * 3. Add an entry for each map page where the location appears
 * 
 * Example:
 * {
 *   locationName: "Main Library",
 *   positions: [
 *     { page: 1, x: 45, y: 30 },  // On page 1, at 45% from left, 30% from top
 *     { page: 2, x: 10, y: 50 },  // On page 2, at 10% from left, 50% from top
 *   ]
 * }
 */

export type MapPosition = {
  page: number; // Map page number (1-5)
  x: number;    // Horizontal position as percentage (0-100) - left edge of clickable area
  y: number;    // Vertical position as percentage (0-100) - top edge of clickable area
  width?: number;  // Width of clickable area as percentage (0-100), default: auto (point marker)
  height?: number; // Height of clickable area as percentage (0-100), default: auto (point marker)
};

export type LocationMapPosition = {
  locationName: string;  // Must match the location name in the database, or can be a map-only location
  positions: MapPosition[];
  type?: string;  // Optional: type of location (e.g., "CLASS ROOMS", "UNIVERSITY ADMINISTRATION")
  description?: string;  // Optional: description for map-only locations
  isMapOnly?: boolean;  // If true, this location only exists on the map (no 360 view)
};

/**
 * Map positions for all locations across all map pages.
 * 
 * Page assignments:
 * - Page 1: Basement Floor (/maps/Page_1 copy.jpg)
 * - Page 2: Ground Floor (/maps/Page_2 copy.jpg)
 * - Page 3: First Floor (/maps/Page_3 copy.jpg)
 * - Page 4: Second Floor (/maps/Page_4 copy.jpg)
 * - Page 5: Campus Overview (/maps/Page_5 copy.jpg)
 * 
 * Instructions:
 * 1. Open each map image
 * 2. Identify all locations visible on that page
 * 3. Estimate the position (x, y) as percentages
 * 4. Add entries below
 */
export const locationMapPositions: LocationMapPosition[] = [
  // Main campus locations (with 360 views) - Located on First Floor (Page 3)
  {
    locationName: "Campus Quad",
    positions: [
      { page: 3, x: 50, y: 45 },
    ]
  },
  {
    locationName: "Main Library",
    positions: [
      { page: 3, x: 65, y: 35 },
    ]
  },
  {
    locationName: "Student Union",
    positions: [
      { page: 3, x: 40, y: 50 },
    ]
  },
  {
    locationName: "Science Hall",
    positions: [
      { page: 3, x: 70, y: 40 },
    ]
  },
  
  // Basement Floor Locations (Page 1) - Map-only locations
  // Coordinates calculated from HTML image map using ACTUAL image dimensions: 1113x2955px
  // Dining and Cafe
  {
    locationName: "Dining Hall",
    type: "DINING HALL",
    isMapOnly: true,
    positions: [
      { page: 1, x: 16.8913, y: 3.0795, width: 39.8023, height: 9.0694 },
    ]
  },
  {
    locationName: "Cafeteria",
    type: "CAFE",
    isMapOnly: true,
    positions: [
      { page: 1, x: 57.1429, y: 3.6210, width: 14.6451, height: 9.4078 },
    ]
  },
  {
    locationName: "Kitchen / Mutfak",
    type: "KITCHEN",
    isMapOnly: true,
    positions: [
      { page: 1, x: 71.8778, y: 3.7225, width: 13.7466, height: 6.1929 },
    ]
  },
  // Conference Hall
  {
    locationName: "Conference Hall I",
    type: "CONFERENCE HALL",
    isMapOnly: true,
    positions: [
      { page: 1, x: 14.6451, y: 12.4873, width: 19.5867, height: 11.2014 },
    ]
  },
  // W.C.
  {
    locationName: "WC (Right Top)",
    type: "W.C.",
    isMapOnly: true,
    positions: [
      { page: 1, x: 56.3342, y: 13.0964, width: 16.9811, height: 3.8579 },
    ]
  },
  {
    locationName: "WC (Right Bottom)",
    type: "W.C.",
    isMapOnly: true,
    positions: [
      { page: 1, x: 56.3342, y: 47.0051, width: 16.0827, height: 6.1929 },
    ]
  },
  // Classrooms
  {
    locationName: "CR101",
    type: "CLASS ROOMS",
    isMapOnly: true,
    positions: [
      { page: 1, x: 56.9632, y: 17.1235, width: 21.4735, height: 5.7191 },
    ]
  },
  {
    locationName: "CR102",
    type: "CLASS ROOMS",
    isMapOnly: true,
    positions: [
      { page: 1, x: 56.6936, y: 22.9780, width: 21.8329, height: 5.2453 },
    ]
  },
  {
    locationName: "CR103",
    type: "CLASS ROOMS",
    isMapOnly: true,
    positions: [
      { page: 1, x: 56.7835, y: 28.3926, width: 21.6532, height: 6.1591 },
    ]
  },
  {
    locationName: "CR104",
    type: "CLASS ROOMS",
    isMapOnly: true,
    positions: [
      { page: 1, x: 56.9632, y: 34.7208, width: 21.5633, height: 5.3469 },
    ]
  },
  {
    locationName: "CR105",
    type: "CLASS ROOMS",
    isMapOnly: true,
    positions: [
      { page: 1, x: 56.6936, y: 40.0677, width: 15.5436, height: 3.2149 },
    ]
  },
  {
    locationName: "CR106",
    type: "CLASS ROOMS",
    isMapOnly: true,
    positions: [
      { page: 1, x: 56.5139, y: 43.3503, width: 15.7233, height: 3.5195 },
    ]
  },
  {
    locationName: "CR107",
    type: "CLASS ROOMS",
    isMapOnly: true,
    positions: [
      { page: 1, x: 56.7835, y: 53.3672, width: 15.5436, height: 3.1472 },
    ]
  },
  {
    locationName: "CR108",
    type: "CLASS ROOMS",
    isMapOnly: true,
    positions: [
      { page: 1, x: 56.2444, y: 56.5482, width: 15.9030, height: 3.1472 },
    ]
  },
  {
    locationName: "CR109",
    type: "CLASS ROOMS",
    isMapOnly: true,
    positions: [
      { page: 1, x: 56.1545, y: 59.8985, width: 16.5319, height: 3.0118 },
    ]
  },
  {
    locationName: "CR110",
    type: "CLASS ROOMS",
    isMapOnly: true,
    positions: [
      { page: 1, x: 56.6936, y: 63.0457, width: 15.5436, height: 2.9103 },
    ]
  },
  {
    locationName: "CR111",
    type: "CLASS ROOMS",
    isMapOnly: true,
    positions: [
      { page: 1, x: 56.5139, y: 73.6379, width: 16.1725, height: 3.1472 },
    ]
  },
  {
    locationName: "CR112",
    type: "CLASS ROOMS",
    isMapOnly: true,
    positions: [
      { page: 1, x: 56.3342, y: 76.9882, width: 15.6334, height: 3.0118 },
    ]
  },
  {
    locationName: "CR113",
    type: "CLASS ROOMS",
    isMapOnly: true,
    positions: [
      { page: 1, x: 37.8257, y: 49.2047, width: 13.6568, height: 3.9932 },
    ]
  },
  {
    locationName: "CR114",
    type: "CLASS ROOMS",
    isMapOnly: true,
    positions: [
      { page: 1, x: 37.8257, y: 53.2995, width: 13.6568, height: 3.3841 },
    ]
  },
  {
    locationName: "CR115",
    type: "CLASS ROOMS",
    isMapOnly: true,
    positions: [
      { page: 1, x: 39.6226, y: 82.8765, width: 7.9964, height: 6.0237 },
    ]
  },
  {
    locationName: "CR116",
    type: "CLASS ROOMS",
    isMapOnly: true,
    positions: [
      { page: 1, x: 31.1770, y: 82.8426, width: 8.0863, height: 5.8883 },
    ]
  },
  {
    locationName: "CR117",
    type: "CLASS ROOMS",
    isMapOnly: true,
    positions: [
      { page: 1, x: 22.0126, y: 82.9442, width: 8.6253, height: 6.0237 },
    ]
  },
  {
    locationName: "CR118",
    type: "CLASS ROOMS",
    isMapOnly: true,
    positions: [
      { page: 1, x: 37.8257, y: 57.0220, width: 13.7466, height: 2.7073 },
    ]
  },
  {
    locationName: "Drama",
    type: "CLASS ROOMS",
    isMapOnly: true,
    positions: [
      { page: 1, x: 56.3342, y: 80.3046, width: 15.4537, height: 2.8088 },
    ]
  },
  // Academic Unit Administration (Labs)
  {
    locationName: "Computer Lab III",
    type: "ACADEMIC UNIT ADMINISTRATION",
    isMapOnly: true,
    positions: [
      { page: 1, x: 14.7350, y: 23.8917, width: 19.5867, height: 4.3993 },
    ]
  },
  {
    locationName: "Computer Lab I",
    type: "ACADEMIC UNIT ADMINISTRATION",
    isMapOnly: true,
    positions: [
      { page: 1, x: 14.5553, y: 46.8697, width: 16.5319, height: 4.3655 },
    ]
  },
  {
    locationName: "Computer Lab II",
    type: "ACADEMIC UNIT ADMINISTRATION",
    isMapOnly: true,
    positions: [
      { page: 1, x: 14.2857, y: 51.3029, width: 17.3405, height: 4.1286 },
    ]
  },
  {
    locationName: "Circuit & Electronics Laboratories",
    type: "ACADEMIC UNIT ADMINISTRATION",
    isMapOnly: true,
    positions: [
      { page: 1, x: 14.4654, y: 55.6007, width: 16.7116, height: 4.5685 },
    ]
  },
  {
    locationName: "PCR Lab I",
    type: "ACADEMIC UNIT ADMINISTRATION",
    isMapOnly: true,
    positions: [
      { page: 1, x: 14.5553, y: 60.4738, width: 11.1411, height: 7.2758 },
    ]
  },
  {
    locationName: "Physics Lab",
    type: "ACADEMIC UNIT ADMINISTRATION",
    isMapOnly: true,
    positions: [
      { page: 1, x: 14.8248, y: 72.3858, width: 10.7817, height: 7.8173 },
    ]
  },
  // Library
  {
    locationName: "Library",
    type: "LIBRARY",
    isMapOnly: true,
    positions: [
      { page: 1, x: 15.0045, y: 28.4941, width: 19.0476, height: 18.1387 },
    ]
  },
  {
    locationName: "E.Library",
    type: "LIBRARY",
    isMapOnly: true,
    positions: [
      { page: 1, x: 31.0872, y: 73.2318, width: 17.0710, height: 6.7005 },
    ]
  },
  // Open Gallery
  {
    locationName: "Open Gallery",
    type: "OPEN GALLERY",
    isMapOnly: true,
    positions: [
      { page: 1, x: 41.3297, y: 27.2420, width: 8.8050, height: 9.6785 },
    ]
  },
  // Green Space
  {
    locationName: "Green Space",
    type: "GREEN SPACE",
    isMapOnly: true,
    positions: [
      { page: 1, x: 30.9075, y: 65.7191, width: 18.5984, height: 6.7682 },
    ]
  },
  // Prayer Rooms
  {
    locationName: "Men's Prayer Room",
    type: "PRAYER ROOM",
    isMapOnly: true,
    positions: [
      { page: 1, x: 48.1581, y: 85.9222, width: 8.0863, height: 3.0457 },
    ]
  },
  {
    locationName: "Women's Prayer Room",
    type: "PRAYER ROOM",
    isMapOnly: true,
    positions: [
      { page: 1, x: 14.4654, y: 86.3959, width: 7.0979, height: 2.3689 },
    ]
  },
  
  // Ground Floor Locations (Page 2) - Map-only locations
  // Coordinates calculated from HTML image map using ACTUAL image dimensions: 1058x2939px
  // West Wing - Administrative Offices and Classrooms
  {
    locationName: "General Accounting 2",
    type: "ADMINISTRATION",
    isMapOnly: true,
    positions: [
      { page: 2, x: 11.6257, y: 10.7520, width: 22.3062, height: 1.9394 },
    ]
  },
  {
    locationName: "CR128",
    type: "CLASS ROOMS",
    isMapOnly: true,
    positions: [
      { page: 2, x: 12.0038, y: 12.9976, width: 21.5501, height: 3.6407 },
    ]
  },
  {
    locationName: "CR127",
    type: "CLASS ROOMS",
    isMapOnly: true,
    positions: [
      { page: 2, x: 11.9093, y: 16.8765, width: 21.4556, height: 5.5801 },
    ]
  },
  {
    locationName: "CR126",
    type: "CLASS ROOMS",
    isMapOnly: true,
    positions: [
      { page: 2, x: 12.0038, y: 22.6948, width: 21.4556, height: 5.0357 },
    ]
  },
  {
    locationName: "CR125",
    type: "CLASS ROOMS",
    isMapOnly: true,
    positions: [
      { page: 2, x: 11.9093, y: 27.8326, width: 21.5501, height: 6.3967 },
    ]
  },
  {
    locationName: "CR124",
    type: "CLASS ROOMS",
    isMapOnly: true,
    positions: [
      { page: 2, x: 11.9093, y: 34.2293, width: 21.3611, height: 5.7503 },
    ]
  },
  {
    locationName: "Health Centre",
    type: "ADMINISTRATION",
    isMapOnly: true,
    positions: [
      { page: 2, x: 12.0983, y: 46.2062, width: 18.3365, height: 3.5386 },
    ]
  },
  {
    locationName: "International Office",
    type: "ADMINISTRATION",
    isMapOnly: true,
    positions: [
      { page: 2, x: 11.6257, y: 49.7788, width: 13.1380, height: 6.5328 },
    ]
  },
  {
    locationName: "Accounting Office",
    type: "ADMINISTRATION",
    isMapOnly: true,
    positions: [
      { page: 2, x: 11.6257, y: 56.3797, width: 13.1380, height: 3.3004 },
    ]
  },
  {
    locationName: "Registration Office",
    type: "ADMINISTRATION",
    isMapOnly: true,
    positions: [
      { page: 2, x: 11.6257, y: 59.7142, width: 13.1380, height: 7.8598 },
    ]
  },
  {
    locationName: "General Accounting Office 1",
    type: "ADMINISTRATION",
    isMapOnly: true,
    positions: [
      { page: 2, x: 11.9093, y: 71.9973, width: 12.5709, height: 1.9735 },
    ]
  },
  {
    locationName: "Information Desk",
    type: "ADMINISTRATION",
    isMapOnly: true,
    positions: [
      { page: 2, x: 11.7202, y: 73.9707, width: 12.9490, height: 6.0565 },
    ]
  },

  // Central Atrium and Services
  {
    locationName: "Dormitories Administration",
    type: "ADMINISTRATION",
    isMapOnly: true,
    positions: [
      { page: 2, x: 59.3573, y: 76.6587, width: 5.9546, height: 3.3004 },
    ]
  },
  {
    locationName: "WC",
    type: "W.C.",
    isMapOnly: true,
    positions: [
      { page: 2, x: 53.2136, y: 71.9633, width: 12.2873, height: 4.5594 },
    ]
  },

  // East Wing - Deans and Administration
  {
    locationName: "Dean Office (Faculty of Arts and Sciences)",
    type: "ACADEMIC UNIT ADMINISTRATION",
    isMapOnly: true,
    positions: [
      { page: 2, x: 53.3081, y: 62.7424, width: 20.6994, height: 2.9942 },
    ]
  },
  {
    locationName: "Dean Office (Faculty of Economics and Administrative Sciences)",
    type: "ACADEMIC UNIT ADMINISTRATION",
    isMapOnly: true,
    positions: [
      { page: 2, x: 53.5917, y: 59.7482, width: 20.4159, height: 3.0282 },
    ]
  },
  {
    locationName: "Dean Office (Faculty of Educational Sciences)",
    type: "ACADEMIC UNIT ADMINISTRATION",
    isMapOnly: true,
    positions: [
      { page: 2, x: 53.2136, y: 56.4137, width: 20.6049, height: 3.1643 },
    ]
  },
  {
    locationName: "Dean Office (Faculty of Law)",
    type: "ACADEMIC UNIT ADMINISTRATION",
    isMapOnly: true,
    positions: [
      { page: 2, x: 53.3081, y: 52.9432, width: 20.5104, height: 3.4365 },
    ]
  },
  {
    locationName: "Dean Office (Faculty of Engineering)",
    type: "ACADEMIC UNIT ADMINISTRATION",
    isMapOnly: true,
    positions: [
      { page: 2, x: 53.4972, y: 50.0851, width: 20.4159, height: 2.7901 },
    ]
  },
  {
    locationName: "Vice Rector",
    type: "UNIVERSITY ADMINISTRATION",
    isMapOnly: true,
    positions: [
      { page: 2, x: 53.5917, y: 46.3423, width: 20.6994, height: 3.6407 },
    ]
  },
  {
    locationName: "IT Helpdesk",
    type: "ADMINISTRATION",
    isMapOnly: true,
    positions: [
      { page: 2, x: 42.2495, y: 46.0701, width: 10.9641, height: 5.8183 },
    ]
  },

  // East Wing - Clinics, Dining, and Terraces
  {
    locationName: "Dentistry Clinic",
    type: "ADMINISTRATION",
    isMapOnly: true,
    positions: [
      { page: 2, x: 49.5274, y: 42.2252, width: 8.3176, height: 3.9129 },
    ]
  },
  {
    locationName: "Kitchen",
    type: "KITCHEN",
    isMapOnly: true,
    positions: [
      { page: 2, x: 57.7505, y: 42.5655, width: 16.1626, height: 3.5726 },
    ]
  },
  {
    locationName: "Final Cafe",
    type: "CAFE",
    isMapOnly: true,
    positions: [
      { page: 2, x: 57.8450, y: 34.2974, width: 16.0681, height: 8.3021 },
    ]
  },
  {
    locationName: "Terrace",
    type: "TERRACE",
    isMapOnly: true,
    positions: [
      { page: 2, x: 74.1966, y: 34.1273, width: 5.6711, height: 11.6026 },
    ]
  },

  // East Wing - Classrooms and Lecture Halls
  {
    locationName: "CR123",
    type: "CLASS ROOMS",
    isMapOnly: true,
    positions: [
      { page: 2, x: 56.5217, y: 27.9347, width: 17.9584, height: 6.1586 },
    ]
  },
  {
    locationName: "CR122",
    type: "CLASS ROOMS",
    isMapOnly: true,
    positions: [
      { page: 2, x: 56.7108, y: 22.6267, width: 21.0775, height: 5.1718 },
    ]
  },
  {
    locationName: "CR121",
    type: "CLASS ROOMS",
    isMapOnly: true,
    positions: [
      { page: 2, x: 56.8998, y: 16.7744, width: 21.1720, height: 5.7162 },
    ]
  },
  {
    locationName: "CR120",
    type: "CLASS ROOMS",
    isMapOnly: true,
    positions: [
      { page: 2, x: 56.9943, y: 10.7179, width: 20.6994, height: 5.9544 },
    ]
  },
  {
    locationName: "AS140",
    type: "ACADEMIC UNIT ADMINISTRATION",
    isMapOnly: true,
    positions: [
      { page: 2, x: 45.6522, y: 10.8540, width: 10.8696, height: 4.2191 },
    ]
  },
  {
    locationName: "AS139",
    type: "ACADEMIC UNIT ADMINISTRATION",
    isMapOnly: true,
    positions: [
      { page: 2, x: 34.1210, y: 10.8881, width: 11.2476, height: 3.9809 },
    ]
  },
  {
    locationName: "CR129",
    type: "CLASS ROOMS",
    isMapOnly: true,
    positions: [
      { page: 2, x: 40.3592, y: 20.3811, width: 9.8299, height: 4.4233 },
    ]
  },
  
  // First Floor Locations (Page 3) - Map-only locations
  // Coordinates calculated from HTML image map using ACTUAL image dimensions: 955x2805px
  {
    locationName: "AS144",
    type: "ACADEMIC UNIT ADMINISTRATION",
    isMapOnly: true,
    positions: [
      { page: 3, x: 15.2880, y: 3.1373, width: 23.8743, height: 1.8895 },
    ]
  },
  {
    locationName: "Nursing Laboratory",
    type: "LABORATORY",
    isMapOnly: true,
    positions: [
      { page: 3, x: 39.2670, y: 3.1729, width: 24.8168, height: 3.8503 },
    ]
  },
  {
    locationName: "CR132",
    type: "CLASS ROOMS",
    isMapOnly: true,
    positions: [
      { page: 3, x: 64.5026, y: 3.0303, width: 22.6178, height: 5.9180 },
    ]
  },
  {
    locationName: "CR136",
    type: "CLASS ROOMS",
    isMapOnly: true,
    positions: [
      { page: 3, x: 15.0785, y: 5.2406, width: 23.4555, height: 3.6720 },
    ]
  },
  {
    locationName: "CR135",
    type: "CLASS ROOMS",
    isMapOnly: true,
    positions: [
      { page: 3, x: 14.8691, y: 9.1979, width: 23.5602, height: 5.8467 },
    ]
  },
  {
    locationName: "CR134",
    type: "CLASS ROOMS",
    isMapOnly: true,
    positions: [
      { page: 3, x: 15.1832, y: 15.2585, width: 23.3508, height: 5.3832 },
    ]
  },
  {
    locationName: "Conference Hall 2",
    type: "CONFERENCE HALL",
    isMapOnly: true,
    positions: [
      { page: 3, x: 15.2880, y: 20.7130, width: 23.0366, height: 12.4421 },
    ]
  },
  {
    locationName: "CR130",
    type: "CLASS ROOMS",
    isMapOnly: true,
    positions: [
      { page: 3, x: 64.0838, y: 9.1266, width: 23.1414, height: 5.9537 },
    ]
  },
  {
    locationName: "CR131",
    type: "CLASS ROOMS",
    isMapOnly: true,
    positions: [
      { page: 3, x: 64.2932, y: 15.2228, width: 23.1414, height: 5.3832 },
    ]
  },
  {
    locationName: "WC (East)",
    type: "W.C.",
    isMapOnly: true,
    positions: [
      { page: 3, x: 64.3979, y: 20.6061, width: 18.8482, height: 6.5954 },
    ]
  },
  {
    locationName: "Board of Trustees International Affairs Coordinator",
    type: "ADMINISTRATION",
    isMapOnly: true,
    positions: [
      { page: 3, x: 25.4450, y: 33.3690, width: 13.2984, height: 2.7807 },
    ]
  },
  {
    locationName: "Guidance and Psychological Counseling Laboratory",
    type: "LABORATORY",
    isMapOnly: true,
    positions: [
      { page: 3, x: 25.5497, y: 36.3636, width: 12.8796, height: 2.9234 },
    ]
  },
  {
    locationName: "AS122",
    type: "ACADEMIC UNIT ADMINISTRATION",
    isMapOnly: true,
    positions: [
      { page: 3, x: 14.7644, y: 39.3939, width: 13.7173, height: 2.8520 },
    ]
  },
  {
    locationName: "AS121",
    type: "ACADEMIC UNIT ADMINISTRATION",
    isMapOnly: true,
    positions: [
      { page: 3, x: 15.0785, y: 42.3529, width: 15.0785, height: 2.3886 },
    ]
  },
  {
    locationName: "AS120",
    type: "ACADEMIC UNIT ADMINISTRATION",
    isMapOnly: true,
    positions: [
      { page: 3, x: 14.7644, y: 44.8128, width: 15.3927, height: 2.3173 },
    ]
  },
  {
    locationName: "AS119",
    type: "ACADEMIC UNIT ADMINISTRATION",
    isMapOnly: true,
    positions: [
      { page: 3, x: 14.4503, y: 47.0588, width: 15.6021, height: 2.3173 },
    ]
  },
  {
    locationName: "AS118",
    type: "ACADEMIC UNIT ADMINISTRATION",
    isMapOnly: true,
    positions: [
      { page: 3, x: 14.6597, y: 49.4831, width: 15.4974, height: 2.2460 },
    ]
  },
  {
    locationName: "AS117",
    type: "ACADEMIC UNIT ADMINISTRATION",
    isMapOnly: true,
    positions: [
      { page: 3, x: 14.7644, y: 51.7291, width: 15.4974, height: 2.3173 },
    ]
  },
  {
    locationName: "AS116",
    type: "ACADEMIC UNIT ADMINISTRATION",
    isMapOnly: true,
    positions: [
      { page: 3, x: 14.8691, y: 54.1889, width: 15.2880, height: 2.1747 },
    ]
  },
  {
    locationName: "AS115",
    type: "ACADEMIC UNIT ADMINISTRATION",
    isMapOnly: true,
    positions: [
      { page: 3, x: 14.6597, y: 56.3280, width: 15.6021, height: 2.7807 },
    ]
  },
  {
    locationName: "AS114",
    type: "ACADEMIC UNIT ADMINISTRATION",
    isMapOnly: true,
    positions: [
      { page: 3, x: 14.5550, y: 59.1087, width: 15.7068, height: 3.0660 },
    ]
  },
  {
    locationName: "AS113",
    type: "ACADEMIC UNIT ADMINISTRATION",
    isMapOnly: true,
    positions: [
      { page: 3, x: 15.2880, y: 66.9162, width: 10.8901, height: 2.6738 },
    ]
  },
  {
    locationName: "AS112 (Directorate Institute of Graduate Studies)",
    type: "ACADEMIC UNIT ADMINISTRATION",
    isMapOnly: true,
    positions: [
      { page: 3, x: 14.5550, y: 69.5544, width: 11.8325, height: 2.6381 },
    ]
  },
  {
    locationName: "AS111",
    type: "ACADEMIC UNIT ADMINISTRATION",
    isMapOnly: true,
    positions: [
      { page: 3, x: 14.8691, y: 72.6916, width: 11.2042, height: 2.6025 },
    ]
  },
  {
    locationName: "WC (West)",
    type: "W.C.",
    isMapOnly: true,
    positions: [
      { page: 3, x: 63.0366, y: 66.8093, width: 10.7853, height: 8.5561 },
    ]
  },
  {
    locationName: "IT Centre",
    type: "ADMINISTRATION",
    isMapOnly: true,
    positions: [
      { page: 3, x: 58.4293, y: 59.4652, width: 14.0314, height: 2.6738 },
    ]
  },
  {
    locationName: "AS133",
    type: "ACADEMIC UNIT ADMINISTRATION",
    isMapOnly: true,
    positions: [
      { page: 3, x: 73.2984, y: 57.2549, width: 9.9476, height: 3.4225 },
    ]
  },
  {
    locationName: "AS134 (Dean Office - Faculty of Architecture and Fine Arts)",
    type: "ACADEMIC UNIT ADMINISTRATION",
    isMapOnly: true,
    positions: [
      { page: 3, x: 72.9843, y: 54.0820, width: 10.2618, height: 3.0303 },
    ]
  },
  {
    locationName: "AS135",
    type: "ACADEMIC UNIT ADMINISTRATION",
    isMapOnly: true,
    positions: [
      { page: 3, x: 73.1937, y: 50.5526, width: 10.0524, height: 3.4938 },
    ]
  },
  {
    locationName: "AS136 (Dean Office - Faculty of Health Sciences)",
    type: "ACADEMIC UNIT ADMINISTRATION",
    isMapOnly: true,
    positions: [
      { page: 3, x: 72.9843, y: 47.0945, width: 10.8901, height: 3.4225 },
    ]
  },
  {
    locationName: "AS137 (School of Physical Education and Sports)",
    type: "ACADEMIC UNIT ADMINISTRATION",
    isMapOnly: true,
    positions: [
      { page: 3, x: 73.0890, y: 43.5651, width: 10.1571, height: 3.3868 },
    ]
  },
  {
    locationName: "AS138",
    type: "ACADEMIC UNIT ADMINISTRATION",
    isMapOnly: true,
    positions: [
      { page: 3, x: 72.8796, y: 39.9287, width: 10.2618, height: 3.4938 },
    ]
  },
  {
    locationName: "Kitchen",
    type: "KITCHEN",
    isMapOnly: true,
    positions: [
      { page: 3, x: 60.8377, y: 39.9643, width: 11.7277, height: 2.4599 },
    ]
  },
  {
    locationName: "AS128",
    type: "ACADEMIC UNIT ADMINISTRATION",
    isMapOnly: true,
    positions: [
      { page: 3, x: 58.4293, y: 43.5651, width: 10.6806, height: 3.1016 },
    ]
  },
  {
    locationName: "AS129",
    type: "ACADEMIC UNIT ADMINISTRATION",
    isMapOnly: true,
    positions: [
      { page: 3, x: 58.5340, y: 46.6667, width: 10.3665, height: 2.9234 },
    ]
  },
  {
    locationName: "AS130",
    type: "ACADEMIC UNIT ADMINISTRATION",
    isMapOnly: true,
    positions: [
      { page: 3, x: 58.3246, y: 49.6257, width: 10.5759, height: 2.8164 },
    ]
  },
  {
    locationName: "AS131",
    type: "ACADEMIC UNIT ADMINISTRATION",
    isMapOnly: true,
    positions: [
      { page: 3, x: 58.4293, y: 52.5134, width: 10.6806, height: 2.8877 },
    ]
  },
  {
    locationName: "AS132 (Yunusemre Institute)",
    type: "ACADEMIC UNIT ADMINISTRATION",
    isMapOnly: true,
    positions: [
      { page: 3, x: 58.4293, y: 55.4724, width: 10.7853, height: 2.7807 },
    ]
  },
  {
    locationName: "AS125",
    type: "ACADEMIC UNIT ADMINISTRATION",
    isMapOnly: true,
    positions: [
      { page: 3, x: 35.3927, y: 49.8039, width: 9.0052, height: 3.1729 },
    ]
  },
  {
    locationName: "AS126",
    type: "ACADEMIC UNIT ADMINISTRATION",
    isMapOnly: true,
    positions: [
      { page: 3, x: 44.5026, y: 49.8039, width: 9.4241, height: 3.2442 },
    ]
  },
  {
    locationName: "AS124",
    type: "ACADEMIC UNIT ADMINISTRATION",
    isMapOnly: true,
    positions: [
      { page: 3, x: 35.6021, y: 46.8806, width: 8.7958, height: 2.8877 },
    ]
  },
  {
    locationName: "AS127",
    type: "ACADEMIC UNIT ADMINISTRATION",
    isMapOnly: true,
    positions: [
      { page: 3, x: 44.6073, y: 46.8093, width: 8.6911, height: 2.9590 },
    ]
  },
  {
    locationName: "AS123",
    type: "ACADEMIC UNIT ADMINISTRATION",
    isMapOnly: true,
    positions: [
      { page: 3, x: 35.3927, y: 43.9929, width: 18.1152, height: 2.7807 },
    ]
  },
  {
    locationName: "AS123A",
    type: "ACADEMIC UNIT ADMINISTRATION",
    isMapOnly: true,
    positions: [
      { page: 3, x: 35.3927, y: 39.8930, width: 18.2199, height: 3.8859 },
    ]
  },
  // Second Floor Locations (Page 4) - Map-only locations
  // Coordinates calculated from HTML image map using ACTUAL image dimensions: 984x2805px
  // Classrooms
  {
    locationName: "CR145",
    type: "CLASS ROOMS",
    isMapOnly: true,
    positions: [
      { page: 4, x: 18.0894, y: 1.4973, width: 23.7805, height: 6.1319 },
    ]
  },
  {
    locationName: "CR146",
    type: "CLASS ROOMS",
    isMapOnly: true,
    positions: [
      { page: 4, x: 42.2764, y: 1.5686, width: 12.8049, height: 7.7718 },
    ]
  },
  {
    locationName: "CR146A",
    type: "CLASS ROOMS",
    isMapOnly: true,
    positions: [
      { page: 4, x: 55.6911, y: 1.6399, width: 12.7033, height: 7.7718 },
    ]
  },
  {
    locationName: "CR145A",
    type: "CLASS ROOMS",
    isMapOnly: true,
    positions: [
      { page: 4, x: 69.0041, y: 1.3904, width: 19.5122, height: 6.3102 },
    ]
  },
  {
    locationName: "CR144",
    type: "CLASS ROOMS",
    isMapOnly: true,
    positions: [
      { page: 4, x: 18.2927, y: 7.7362, width: 18.8008, height: 5.9180 },
    ]
  },
  {
    locationName: "CR144A",
    type: "CLASS ROOMS",
    isMapOnly: true,
    positions: [
      { page: 4, x: 73.4756, y: 7.9501, width: 14.6341, height: 5.9180 },
    ]
  },
  {
    locationName: "CR147",
    type: "CLASS ROOMS",
    isMapOnly: true,
    positions: [
      { page: 4, x: 41.9715, y: 9.5187, width: 13.1098, height: 7.9857 },
    ]
  },
  {
    locationName: "CR147A",
    type: "CLASS ROOMS",
    isMapOnly: true,
    positions: [
      { page: 4, x: 55.6911, y: 9.5544, width: 12.8049, height: 8.0214 },
    ]
  },
  {
    locationName: "CR143",
    type: "CLASS ROOMS",
    isMapOnly: true,
    positions: [
      { page: 4, x: 18.2927, y: 13.7968, width: 19.0041, height: 5.3119 },
    ]
  },
  {
    locationName: "CR143A",
    type: "CLASS ROOMS",
    isMapOnly: true,
    positions: [
      { page: 4, x: 73.5772, y: 13.9394, width: 14.9390, height: 5.3476 },
    ]
  },
  {
    locationName: "CR142",
    type: "CLASS ROOMS",
    isMapOnly: true,
    positions: [
      { page: 4, x: 18.3943, y: 19.2513, width: 23.1707, height: 3.7790 },
    ]
  },
  {
    locationName: "CR148A",
    type: "CLASS ROOMS",
    isMapOnly: true,
    positions: [
      { page: 4, x: 59.4512, y: 20.7130, width: 14.8374, height: 5.2050 },
    ]
  },
  {
    locationName: "CR142A",
    type: "CLASS ROOMS",
    isMapOnly: true,
    positions: [
      { page: 4, x: 75.2033, y: 19.4652, width: 13.0081, height: 6.7736 },
    ]
  },
  {
    locationName: "CR141",
    type: "CLASS ROOMS",
    isMapOnly: true,
    positions: [
      { page: 4, x: 18.2927, y: 23.2442, width: 23.6789, height: 7.4866 },
    ]
  },
  {
    locationName: "CR140A",
    type: "CLASS ROOMS",
    isMapOnly: true,
    positions: [
      { page: 4, x: 59.3496, y: 26.1319, width: 10.1626, height: 5.8467 },
    ]
  },
  {
    locationName: "CR140",
    type: "CLASS ROOMS",
    isMapOnly: true,
    positions: [
      { page: 4, x: 17.9878, y: 30.8378, width: 23.8821, height: 7.7362 },
    ]
  },
  // Terrace and Facilities
  {
    locationName: "WC (Center)",
    type: "W.C.",
    isMapOnly: true,
    positions: [
      { page: 4, x: 63.1098, y: 32.2638, width: 6.4024, height: 6.2745 },
    ]
  },
  {
    locationName: "Terrace",
    type: "OPEN GALLERY",
    isMapOnly: true,
    positions: [
      { page: 4, x: 18.8008, y: 38.8592, width: 65.1423, height: 13.4759 },
    ]
  },
  // Academic Unit Administration
  {
    locationName: "AS141 (School of Foreign Languages)",
    type: "ACADEMIC UNIT ADMINISTRATION",
    isMapOnly: true,
    positions: [
      { page: 4, x: 61.5854, y: 52.4421, width: 14.9390, height: 2.1390 },
    ]
  },
  {
    locationName: "AS142 (Career Center)",
    type: "ADMINISTRATION",
    isMapOnly: true,
    positions: [
      { page: 4, x: 61.7886, y: 54.6168, width: 14.7358, height: 2.1390 },
    ]
  },
  {
    locationName: "AS143 (Rectorate Coordinator)",
    type: "ADMINISTRATION",
    isMapOnly: true,
    positions: [
      { page: 4, x: 61.7886, y: 56.8627, width: 14.8374, height: 2.1390 },
    ]
  },
  {
    locationName: "Kitchen",
    type: "KITCHEN",
    isMapOnly: true,
    positions: [
      { page: 4, x: 19.0041, y: 59.0018, width: 9.5528, height: 1.9608 },
    ]
  },
  // University Administration
  {
    locationName: "WC (West)",
    type: "W.C.",
    isMapOnly: true,
    positions: [
      { page: 4, x: 18.3943, y: 65.8111, width: 10.8740, height: 2.8877 },
    ]
  },
  {
    locationName: "WC (East)",
    type: "W.C.",
    isMapOnly: true,
    positions: [
      { page: 4, x: 66.0569, y: 65.7041, width: 9.9593, height: 3.0303 },
    ]
  },
  {
    locationName: "Human Resources Office",
    type: "ADMINISTRATION",
    isMapOnly: true,
    positions: [
      { page: 4, x: 47.5610, y: 68.6988, width: 8.5366, height: 3.2086 },
    ]
  },
  {
    locationName: "Executive Secretary",
    type: "ADMINISTRATION",
    isMapOnly: true,
    positions: [
      { page: 4, x: 56.3008, y: 68.7701, width: 20.2236, height: 2.8164 },
    ]
  },
  {
    locationName: "Deputy General Secretary's Office",
    type: "ADMINISTRATION",
    isMapOnly: true,
    positions: [
      { page: 4, x: 42.7846, y: 71.9430, width: 13.6179, height: 4.0998 },
    ]
  },
  {
    locationName: "Vice Rector Office",
    type: "UNIVERSITY ADMINISTRATION",
    isMapOnly: true,
    positions: [
      { page: 4, x: 60.1626, y: 71.6221, width: 16.3618, height: 4.6346 },
    ]
  },
  {
    locationName: "Board of Trustees",
    type: "ADMINISTRATION",
    isMapOnly: true,
    positions: [
      { page: 4, x: 38.4146, y: 76.0428, width: 17.8862, height: 5.1693 },
    ]
  },
  {
    locationName: "Senate/General Secretary",
    type: "ADMINISTRATION",
    isMapOnly: true,
    positions: [
      { page: 4, x: 18.8008, y: 68.7344, width: 18.9024, height: 12.5134 },
    ]
  },
  {
    locationName: "Rector Office",
    type: "UNIVERSITY ADMINISTRATION",
    isMapOnly: true,
    positions: [
      { page: 4, x: 56.8089, y: 76.2567, width: 19.8171, height: 5.0980 },
    ]
  },
  
  // Campus Overview Locations (Page 5) - Map-only locations
  // Coordinates calculated from HTML image map using ACTUAL image dimensions: 1800x2773px
  {
    locationName: "Sport Salon",
    type: "SPORT SALON",
    isMapOnly: true,
    positions: [
      { page: 5, x: 40.9444, y: 39.5240, width: 16.8889, height: 6.7797 },
    ]
  },
  {
    locationName: "Main Building Area",
    type: "MAIN BUILDING",
    isMapOnly: true,
    positions: [
      { page: 5, x: 37.7222, y: 47.7822, width: 18.7778, height: 44.1399 },
    ]
  },
  {
    locationName: "Bus Station",
    type: "UNIVERSITY BUS STATION",
    isMapOnly: true,
    positions: [
      { page: 5, x: 58.1111, y: 76.6679, width: 4.6667, height: 14.3166 },
    ]
  },
  {
    locationName: "Cafeteria",
    type: "CAFETERIA",
    isMapOnly: true,
    positions: [
      { page: 5, x: 15.2778, y: 58.2041, width: 19.8333, height: 8.2582 },
    ]
  },
  {
    locationName: "Design Studio",
    type: "ACADEMIC UNIT ADMINISTRATION",
    isMapOnly: true,
    positions: [
      { page: 5, x: 28.3889, y: 47.6019, width: 7.7778, height: 5.6617 },
    ]
  },
  {
    locationName: "Pharmacy Faculty Classrooms",
    type: "CLASS ROOMS",
    isMapOnly: true,
    positions: [
      { page: 5, x: 20.6111, y: 46.7724, width: 3.6111, height: 6.4190 },
    ]
  },
  {
    locationName: "Pharmacy Faculty Administration",
    type: "ACADEMIC UNIT ADMINISTRATION",
    isMapOnly: true,
    positions: [
      { page: 5, x: 15.3889, y: 50.5950, width: 5.1111, height: 2.5604 },
    ]
  },
  {
    locationName: "Design Office",
    type: "ADMINISTRATION",
    isMapOnly: true,
    positions: [
      { page: 5, x: 27.3333, y: 53.8045, width: 8.1111, height: 4.0029 },
    ]
  },
  {
    locationName: "University Car Park",
    type: "PARKING",
    isMapOnly: true,
    positions: [
      { page: 5, x: 5, y: 50, width: 25, height: 15 },
    ]
  },
];

/**
 * Get the map position for a location on a specific page
 */
export function getLocationPositionOnPage(
  locationName: string,
  pageIndex: number
): { x: number; y: number; width?: number; height?: number } | null {
  const pageNumber = pageIndex + 1; // Convert 0-based index to 1-based page number
  const locationConfig = locationMapPositions.find(
    (config) => config.locationName === locationName
  );
  
  if (!locationConfig) {
    return null;
  }
  
  const position = locationConfig.positions.find((pos) => pos.page === pageNumber);
  if (!position) {
    return null;
  }
  
  return {
    x: position.x,
    y: position.y,
    width: position.width,
    height: position.height,
  };
}

/**
 * Get location metadata (type, description, isMapOnly) for a location
 */
export function getLocationMetadata(locationName: string): {
  type?: string;
  description?: string;
  isMapOnly?: boolean;
} | null {
  const locationConfig = locationMapPositions.find(
    (config) => config.locationName === locationName
  );
  
  if (!locationConfig) {
    return null;
  }
  
  return {
    type: locationConfig.type,
    description: locationConfig.description,
    isMapOnly: locationConfig.isMapOnly,
  };
}

/**
 * Get all map-only locations on a specific page
 */
export function getMapOnlyLocationsOnPage(pageIndex: number): LocationMapPosition[] {
  const pageNumber = pageIndex + 1;
  return locationMapPositions.filter(
    (config) => config.isMapOnly && config.positions.some((pos) => pos.page === pageNumber)
  );
}

/**
 * Get all locations that appear on a specific map page
 */
export function getLocationsOnPage(pageIndex: number): string[] {
  const pageNumber = pageIndex + 1;
  return locationMapPositions
    .filter((config) => config.positions.some((pos) => pos.page === pageNumber))
    .map((config) => config.locationName);
}


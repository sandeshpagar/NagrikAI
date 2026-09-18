export interface GeoGrievancePin {
  id: string;
  grievanceNumber: string;
  title: string;
  description: string;
  category: string;
  ward: string;
  zone: string;
  landmark: string;
  latitude: number;
  longitude: number;
  status: "REGISTERED" | "IN_PROGRESS" | "RESOLVED";
  priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  registeredAt: string;
  targetResolutionAt: string;
  resolvedAt?: string;
  assignedOfficer: string;
  departmentName: string;
  // Photographic evidence for public transparency
  beforePhoto: string;
  beforePhotoCaption: string;
  afterPhoto?: string;
  afterPhotoCaption?: string;
  resolutionNotes?: string;
}

export const GEO_GRIEVANCE_PINS: GeoGrievancePin[] = [
  {
    id: "geo-001",
    grievanceNumber: "GRV-2026-1042",
    title: "Severe Road Crater & Exposed Electrical Conduit after Monsoon Inundation",
    description: "Deep crater spanning 1.8 meters opposite Petrol Pump. Live underground electrical casing exposed.",
    category: "Road Infrastructure & Potholes",
    ward: "Ward 12 · Sinhagad Road",
    zone: "Zone 4 (South Pune)",
    landmark: "Opposite HP Petrol Pump, Sinhagad Road Junction",
    latitude: 18.4965,
    longitude: 73.8312,
    status: "IN_PROGRESS",
    priority: "CRITICAL",
    registeredAt: "17 Sep 2026, 10:28 AM",
    targetResolutionAt: "18 Sep 2026, 06:00 PM",
    assignedOfficer: "Er. Rajesh Sharma (Junior Engineer)",
    departmentName: "PMC Road Infrastructure & Civil Maintenance",
    beforePhoto:
      "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&auto=format&fit=crop&q=80",
    beforePhotoCaption: "Intake Evidence: 1.8m crater with exposed electrical conduit casing.",
    afterPhoto:
      "https://images.unsplash.com/photo-1578575437130-527eed3abbec?w=600&auto=format&fit=crop&q=80",
    afterPhotoCaption: "Interim Safety: Barricading and drainage diversion installed by squad.",
    resolutionNotes: "Pothole Patching Squad #04 scheduled for hot-mix asphalt compaction on 18 Sep at 10:30 AM.",
  },
  {
    id: "geo-002",
    grievanceNumber: "GRV-2026-1038",
    title: "Streetlight Inoperative at Karve Statue Chowk",
    description: "Sodium lamp ballast blown causing complete dark spot near pedestrian crossing.",
    category: "Street Lighting & Electrical",
    ward: "Ward 10 · Kothrud",
    zone: "Zone 3 (West Pune)",
    landmark: "Karve Statue Chowk, Near Bus Depot, Kothrud",
    latitude: 18.5074,
    longitude: 73.8077,
    status: "RESOLVED",
    priority: "MEDIUM",
    registeredAt: "15 Sep 2026, 09:10 AM",
    targetResolutionAt: "16 Sep 2026, 09:10 PM",
    resolvedAt: "15 Sep 2026, 04:30 PM",
    assignedOfficer: "Er. Amit Shinde (Junior Engineer)",
    departmentName: "Electrical & Public Lighting Dept",
    beforePhoto:
      "https://images.unsplash.com/photo-1509114397022-ed747cca3f65?w=600&auto=format&fit=crop&q=80",
    beforePhotoCaption: "Before: Blown sodium luminaire causing dark zone near pedestrian crossing.",
    afterPhoto:
      "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&auto=format&fit=crop&q=80",
    afterPhotoCaption: "After: High-efficiency 90W LED luminaire replaced and illuminated.",
    resolutionNotes: "LED luminaire driver replaced and feeder line tested. Certified functional.",
  },
  {
    id: "geo-003",
    grievanceNumber: "GRV-2026-1031",
    title: "Uncollected Garbage Accumulation near Deccan Bus Stop",
    description: "Secondary collection bin overflowed for 3 days attracting stray animals and blocking pavement.",
    category: "Sanitation & Solid Waste",
    ward: "Ward 8 · Shaniwar Peth",
    zone: "Zone 1 (Central Pune)",
    landmark: "Near Deccan Gymkhana Bus Terminus, FC Road",
    latitude: 18.5196,
    longitude: 73.8553,
    status: "RESOLVED",
    priority: "HIGH",
    registeredAt: "12 Sep 2026, 07:45 AM",
    targetResolutionAt: "13 Sep 2026, 07:45 AM",
    resolvedAt: "12 Sep 2026, 11:15 AM",
    assignedOfficer: "Shri Dilip Pawar (Sanitation Inspector)",
    departmentName: "Solid Waste Management Dept",
    beforePhoto:
      "https://images.unsplash.com/photo-1605600659908-0ef719419d41?w=600&auto=format&fit=crop&q=80",
    beforePhotoCaption: "Before: Overflowing secondary bin spilling onto pedestrian footpath.",
    afterPhoto:
      "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=600&auto=format&fit=crop&q=80",
    afterPhotoCaption: "After: Waste cleared via compactor truck and disinfectant powder applied.",
    resolutionNotes: "Compactor vehicle dispatched, bin sanitized, bleaching powder applied.",
  },
  {
    id: "geo-004",
    grievanceNumber: "GRV-2026-1055",
    title: "Subsurface Potable Water Pipe Rupture with Road Washout",
    description: "High pressure 300mm pipe burst gushing treated water onto road near Shivajinagar railway crossing.",
    category: "Water Supply & Drainage",
    ward: "Ward 4 · Shivajinagar",
    zone: "Zone 2 (North Pune)",
    landmark: "Opposite Shivajinagar Railway Gate, Ghole Road",
    latitude: 18.5314,
    longitude: 73.8446,
    status: "REGISTERED",
    priority: "CRITICAL",
    registeredAt: "18 Sep 2026, 04:15 AM",
    targetResolutionAt: "18 Sep 2026, 04:15 PM",
    assignedOfficer: "Er. Nandkishore Jagtap (Superintending Engineer)",
    departmentName: "Water Supply & Sewerage Board",
    beforePhoto:
      "https://images.unsplash.com/photo-1584467735815-f778f274e296?w=600&auto=format&fit=crop&q=80",
    beforePhotoCaption: "Intake Photo: Water main rupture flooding road and eroding embankment.",
    resolutionNotes: "Emergency valve closed. Excavator and pipe replacement crew mobilized.",
  },
  {
    id: "geo-005",
    grievanceNumber: "GRV-2026-1020",
    title: "Dangerous Open Manhole on Dhayari Phata Footpath",
    description: "Cast iron manhole lid missing with 2.2m drop near vegetable market entry.",
    category: "Road Infrastructure & Potholes",
    ward: "Ward 12 · Sinhagad Road",
    zone: "Zone 4 (South Pune)",
    landmark: "Dhayari Phata Chowk, Sinhagad Road",
    latitude: 18.4682,
    longitude: 73.8124,
    status: "RESOLVED",
    priority: "CRITICAL",
    registeredAt: "10 Sep 2026, 02:00 PM",
    targetResolutionAt: "11 Sep 2026, 02:00 AM",
    resolvedAt: "10 Sep 2026, 05:45 PM",
    assignedOfficer: "Er. Ramesh Deshmukh (Junior Engineer)",
    departmentName: "PMC Road Infrastructure Division",
    beforePhoto:
      "https://images.unsplash.com/photo-1542382156909-9ae37b3f56fd?w=600&auto=format&fit=crop&q=80",
    beforePhotoCaption: "Before: Hazardous uncovered manhole on Dhayari Phata footpath.",
    afterPhoto:
      "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=600&auto=format&fit=crop&q=80",
    afterPhotoCaption: "After: Reinforced heavy-duty concrete cover installed and sealed.",
    resolutionNotes: "New reinforced concrete cover installed and leveled with asphalt.",
  },
  {
    id: "geo-006",
    grievanceNumber: "GRV-2026-1061",
    title: "Fallen Tree Branch Entangled with High Tension Power Line",
    description: "Heavy branch snapped during thunderstorm resting directly on 11kV distribution line.",
    category: "Street Lighting & Electrical",
    ward: "Ward 10 · Kothrud",
    zone: "Zone 3 (West Pune)",
    landmark: "Ideal Colony Lane #3, Paud Road, Kothrud",
    latitude: 18.5012,
    longitude: 73.8015,
    status: "IN_PROGRESS",
    priority: "HIGH",
    registeredAt: "17 Sep 2026, 11:45 PM",
    targetResolutionAt: "18 Sep 2026, 11:45 AM",
    assignedOfficer: "Er. Manisha Shekatkar (Executive Engineer)",
    departmentName: "Electrical & Public Lighting Dept",
    beforePhoto:
      "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=600&auto=format&fit=crop&q=80",
    beforePhotoCaption: "Intake Evidence: Large gulmohar tree branch pinned on power line.",
    resolutionNotes: "MSEDCL isolation team notified; hydraulic tree cutter vehicle deployed on site.",
  },
  {
    id: "geo-007",
    grievanceNumber: "GRV-2026-1064",
    title: "Secondary Drainage Overflow Flooding Mandai Market Lane",
    description: "Stormwater sewer backed up during morning rush hour causing foul water accumulation.",
    category: "Sanitation & Solid Waste",
    ward: "Ward 8 · Shaniwar Peth",
    zone: "Zone 1 (Central Pune)",
    landmark: "Mahatma Phule Mandai Lane, Shukrawar Peth",
    latitude: 18.5142,
    longitude: 73.8569,
    status: "REGISTERED",
    priority: "MEDIUM",
    registeredAt: "18 Sep 2026, 05:00 AM",
    targetResolutionAt: "19 Sep 2026, 05:00 AM",
    assignedOfficer: "Dr. Anita Joshi (Sanitation Inspector)",
    departmentName: "Solid Waste Management Dept",
    beforePhoto:
      "https://images.unsplash.com/photo-1594498653385-d5172c532c00?w=600&auto=format&fit=crop&q=80",
    beforePhotoCaption: "Intake Photo: Storm drain blocked with plastic sacks and silt.",
    resolutionNotes: "Suction machine vehicle queued for morning market desilting operation.",
  },
];

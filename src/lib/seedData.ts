import { GalleryCategory, SlotKey } from './validation';

export interface CraftsmanProfile {
  businessName: string;
  craftsmanName: string;
  headline: string;
  serviceArea: string;
  yearsExperience: number;
  completedJobs: number;
  hourlyRate: number;
  minimumCallout: number;
  bioSummary: string;
  phoneDisplay: string;
  emailDisplay: string;
  licenseInfo: string;
}

export interface ProjectItem {
  id: string;
  title: string;
  category: GalleryCategory;
  neighborhood: string;
  duration: string;
  materials: string;
  summary: string;
  imageUrl: string;
  featured: boolean;
  sortOrder: number;
}

export interface ScheduleSlotRecord {
  id: string;
  date: string;
  slotKey: SlotKey;
  status: 'booked' | 'blocked';
  appointmentId?: string;
  note?: string;
}

export interface AppointmentRecord {
  id: string;
  userId: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  serviceAddress: string;
  serviceCategory: string;
  date: string;
  slotKey: SlotKey;
  slotId: string;
  description: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  adminNotes: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface EstimateRecord {
  id: string;
  userId: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  neighborhood: string;
  jobType: string;
  scopeUnits: number;
  complexity: 'standard' | 'moderate' | 'complex';
  materialsBy: 'client' | 'handyman';
  urgency: 'flexible' | 'priority';
  estimatedMin: number;
  estimatedMax: number;
  estimatedHours: string;
  projectNotes: string;
  status: 'requested' | 'quoted' | 'accepted' | 'archived';
  formalQuoteAmount: number;
  adminNotes: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export const HERO_WORKSHOP_IMAGE =
  '/src/assets/images/hero_craftsman_workshop_1794881302905.jpg';
export const PORTRAIT_ARTHUR_IMAGE =
  '/src/assets/images/portrait_arthur_vance_1794881304565.jpg';

export const DEFAULT_PROFILE: CraftsmanProfile = {
  businessName: 'Vance Home Craft',
  craftsmanName: 'Arthur Vance',
  headline: 'Precision Home Repairs & Finish Carpentry',
  serviceArea: 'Greater Portland & Willamette Valley',
  yearsExperience: 18,
  completedJobs: 1420,
  hourlyRate: 95,
  minimumCallout: 145,
  bioSummary:
    'I started as a residential finish carpenter in 2008 before expanding into full-scope home maintenance, fixture installation, and architectural repair. Homeowners call me when they want one dependable tradesperson who shows up on time, protects hardwood floors before touching a tool, and leaves every miter, tile line, and latch crisp. Every visit includes a transparent written scope before work begins.',
  phoneDisplay: '(503) 555-0194',
  emailDisplay: 'arthur@vancehomecraft.com',
  licenseInfo: 'CCB #218490 · $2M Liability Insured · EPA Lead-Safe',
};

export const DEFAULT_PROJECTS: ProjectItem[] = [
  {
    id: 'proj_white_oak_builtins',
    title: 'White Oak Alcove Built-Ins & Shaker Base',
    category: 'Carpentry',
    neighborhood: 'Laurelhurst',
    duration: '3 Days',
    materials: 'Rift-sawn white oak, Blum soft-close hinges, solid brass pulls',
    summary:
      'Designed, scribed, and installed floor-to-ceiling alcove shelving and lower shaker cabinetry flush to 1920s plaster walls with concealed LED channel routing.',
    imageUrl: '/src/assets/images/gallery_built_in_shelving_1794881304054.jpg',
    featured: true,
    sortOrder: 1,
  },
  {
    id: 'proj_kitchen_zellige_faucet',
    title: 'Handcrafted Ceramic Backsplash & Bridge Faucet',
    category: 'Kitchen & Bath',
    neighborhood: 'Sellwood',
    duration: '1.5 Days',
    materials: '4x4 glazed ceramic tile, unsanded alabaster grout, unlacquered brass bridge faucet',
    summary:
      'Removed builder-grade laminate backsplash, leveled drywall substrate, tiled full sink wall with crisp inside corners, and plumbed a new brass bridge faucet and air switch.',
    imageUrl: '/src/assets/images/gallery_kitchen_tile_1794881305022.jpg',
    featured: false,
    sortOrder: 2,
  },
  {
    id: 'proj_cedar_privacy_deck',
    title: 'Clear Cedar Deck & Horizontal Privacy Screen',
    category: 'Exterior',
    neighborhood: 'Alameda Ridge',
    duration: '4 Days',
    materials: 'Kiln-dried Western Red Cedar, powder-coated aluminum posts, concealed fasteners',
    summary:
      'Replaced weathered pressure-treated decking with clear cedar planks, framed three flush low-voltage lit steps, and built a 6-foot horizontal privacy screen.',
    imageUrl: '/src/assets/images/gallery_cedar_deck_1794881304638.jpg',
    featured: false,
    sortOrder: 3,
  },
  {
    id: 'proj_oak_door_hardware',
    title: 'Solid-Core Oak Doors & Architectural Hardware',
    category: 'Carpentry',
    neighborhood: 'Irvington',
    duration: '1 Day',
    materials: 'Solid-core rift white oak slabs, Emtek matte black levers, concealed ball catches',
    summary:
      'Mortised and hung four solid-core interior doors into out-of-square vintage jambs, planed reveals to a uniform 3/32-inch gap, and installed matte black levers.',
    imageUrl: '/src/assets/images/gallery_custom_door_1794881304917.jpg',
    featured: false,
    sortOrder: 4,
  },
  {
    id: 'proj_cabinet_lighting_trim',
    title: 'Craftsman Living Room Millwork & Sconce Wiring',
    category: 'Electrical & Lighting',
    neighborhood: 'Lake Oswego',
    duration: '2 Days',
    materials: 'Quarter-sawn white oak trim, Lutron Caseta dimmers, 2700K warm LED strips',
    summary:
      'Finished fireplace flanking bookcases, matched original 1930s window casing profiles, and wired hardwired warm LED shelf lighting on smart dimmers.',
    imageUrl: '/src/assets/images/hero_craftsman_workshop_1794881302905.jpg',
    featured: false,
    sortOrder: 5,
  },
];

export const CORE_SERVICES = [
  {
    num: '01',
    title: 'Finish Carpentry & Custom Trim',
    description:
      'Built-in shelving, crown molding, baseboard replacement, stair treads, cabinet face-frame repairs, and vintage woodwork matching.',
    rateNote: '$95/hr or fixed bid · Avg 2–6 hrs',
  },
  {
    num: '02',
    title: 'Kitchen & Bath Fixtures',
    description:
      'Faucet and garbage disposal swaps, vanity installation, backsplash tiling, toilet rebuilds, caulking, and shower hardware upgrades.',
    rateNote: '$145–$420 typical flat range',
  },
  {
    num: '03',
    title: 'Doors, Windows & Hardware',
    description:
      'Sticking door planing, solid-core door hanging, smart deadbolts, weatherstripping, pocket door track repairs, and sash weights.',
    rateNote: '$165/door standard hang',
  },
  {
    num: '04',
    title: 'Drywall Patching & Interior Paint',
    description:
      'Plumbing access drywall repair, texture matching (orange peel, knockdown, smooth level-4), plaster crack stabilization, and trim enamel.',
    rateNote: '$180–$550 depending on scope',
  },
  {
    num: '05',
    title: 'Decks, Fencing & Exterior Care',
    description:
      'Cedar board replacement, gate sag framing, exterior trim rot repair, fascia patching, storm doors, and gutter guard installation.',
    rateNote: '$95/hr + cedar/hardware at cost',
  },
];

export interface EstimatorJobPreset {
  id: string;
  label: string;
  unitLabel: string;
  minUnits: number;
  maxUnits: number;
  defaultUnits: number;
  baseLabor: number;
  perUnitLabor: number;
  perUnitMaterials: number;
  hoursPerUnit: number;
}

export const ESTIMATOR_PRESETS: EstimatorJobPreset[] = [
  {
    id: 'door_hang',
    label: 'Interior Door & Hardware Hang',
    unitLabel: 'Doors',
    minUnits: 1,
    maxUnits: 8,
    defaultUnits: 2,
    baseLabor: 95,
    perUnitLabor: 155,
    perUnitMaterials: 45,
    hoursPerUnit: 1.75,
  },
  {
    id: 'drywall_paint',
    label: 'Drywall Patch, Texture & Paint',
    unitLabel: 'Patches / Walls',
    minUnits: 1,
    maxUnits: 10,
    defaultUnits: 2,
    baseLabor: 120,
    perUnitLabor: 110,
    perUnitMaterials: 35,
    hoursPerUnit: 1.5,
  },
  {
    id: 'kitchen_bath',
    label: 'Faucet, Vanity or Tile Backsplash',
    unitLabel: 'Fixtures / Sq-Ft Blocks (10sf)',
    minUnits: 1,
    maxUnits: 8,
    defaultUnits: 2,
    baseLabor: 135,
    perUnitLabor: 145,
    perUnitMaterials: 65,
    hoursPerUnit: 1.75,
  },
  {
    id: 'carpentry_shelving',
    label: 'Custom Shelving, Trim & Built-Ins',
    unitLabel: 'Linear Feet (x2 ft)',
    minUnits: 1,
    maxUnits: 12,
    defaultUnits: 4,
    baseLabor: 160,
    perUnitLabor: 95,
    perUnitMaterials: 75,
    hoursPerUnit: 1.25,
  },
  {
    id: 'deck_exterior',
    label: 'Cedar Deck Repair & Exterior Trim',
    unitLabel: 'Sections / Steps',
    minUnits: 1,
    maxUnits: 10,
    defaultUnits: 3,
    baseLabor: 145,
    perUnitLabor: 130,
    perUnitMaterials: 85,
    hoursPerUnit: 1.5,
  },
  {
    id: 'lighting_electrical',
    label: 'Light Fixtures, Fans & Smart Dimmers',
    unitLabel: 'Fixtures / Switches',
    minUnits: 1,
    maxUnits: 12,
    defaultUnits: 3,
    baseLabor: 95,
    perUnitLabor: 75,
    perUnitMaterials: 25,
    hoursPerUnit: 0.8,
  },
];

export const CLIENT_REVIEWS = [
  {
    name: 'Hannah & David Kowalski',
    neighborhood: 'Laurelhurst',
    project: 'White Oak Living Room Built-Ins',
    quote:
      'We had crooked 1924 plaster walls and two contractors told us built-ins would leave gaps. Arthur scribed every vertical stile to the millimeter and finished a half-day ahead of schedule.',
  },
  {
    name: 'Marcus Chen',
    neighborhood: 'Sellwood',
    project: 'Kitchen Backsplash & Plumbing Swap',
    quote:
      'Transparent hourly and flat estimate upfront—the final invoice matched the midpoint of his ballpark quote to the dollar. Zero mess left behind.',
  },
  {
    name: 'Claire Bennett',
    neighborhood: 'Alameda Ridge',
    project: 'Cedar Porch Steps & Three Sticking Doors',
    quote:
      'Booked a morning window online, got a confirmation the same afternoon, and Arthur knocked out three swollen oak doors plus two rotted porch treads in one crisp visit.',
  },
];

// Generate rolling 14-day schedule dates starting from today
export function getUpcomingScheduleDays(daysCount = 14, offsetDays = 0): {
  dateStr: string;
  dayName: string;
  shortDate: string;
  isSunday: boolean;
}[] {
  const result: {
    dateStr: string;
    dayName: string;
    shortDate: string;
    isSunday: boolean;
  }[] = [];
  const base = new Date();
  base.setHours(12, 0, 0, 0);

  for (let i = 1 + offsetDays; i <= daysCount + offsetDays; i++) {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;
    const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
    const shortDate = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    result.push({
      dateStr,
      dayName,
      shortDate,
      isSunday: d.getDay() === 0,
    });
  }
  return result;
}

/**
 * Single source of truth for site content, transcribed from the
 * client-provided brief and Branding.json.
 */

export const brand = {
  name: "Dr Joy Dental Clinics",
  tagline: "The Art of the Smile",
  tollFree: "800 DRJOY (37569)",
  tollFreeTel: "80037569",
  whatsapp: "97180037569",
  whatsappMessage:
    "Hello, Dr Joy Dental Clinic. I would like to book an appointment.",
  site: "https://drjoydentalclinic.com",
  colors: {
    gold: "#AC8B51",
    goldDeep: "#957846",
    goldLight: "#B69A69",
    bg: "#FEFEFE",
  },
} as const;

export const stats = [
  { value: 21, suffix: "", label: "Years of dedicated excellence" },
  { value: 13, suffix: "", label: "Clinics across Dubai" },
  { value: 100, suffix: "+", label: "Renowned dentists, every speciality" },
  { value: 700, suffix: "K+", label: "Smiles entrusted to us" },
] as const;

/**
 * The Living Index — every treatment offered, grouped into four disciplines.
 * Source of truth: the clinic's live Services page (public/services.txt); all
 * 39 treatments are the exact card titles from that page, organised into the
 * Align / Restore / Design / Care disciplines the tree branches into.
 */
export const serviceLedger: { group: string; items: string[] }[] = [
  {
    group: "Align",
    items: [
      "Invisalign",
      "Invisalign First",
      "Orthodontic Braces",
      "Metal and Ceramic Braces",
      "Lingual Braces",
      "Damon Braces",
      "Myobrace",
      "Orthognathic Surgery",
    ],
  },
  {
    group: "Restore",
    items: [
      "Dental Implants",
      "Same Day Dental Implants",
      "3D Guided Implant Surgery",
      "All-on-4 Implants",
      "All-on-6 Implants",
      "Ceramic Dental Implants",
      "Dental Bridges and Crowns",
      "Root Canal Treatment",
      "Dental Fillings",
      "Smart Amalgam Removal",
    ],
  },
  {
    group: "Design",
    items: [
      "Veneers",
      "Hollywood Smile Makeover",
      "Digital Smile Design",
      "Cosmetic Dentistry",
      "Composite Bonding",
      "BioClear Black Triangle Treatment",
      "Teeth Whitening",
      "Zoom Teeth Whitening",
      "Home Teeth Whitening",
      "Gum Depigmentation",
      "Gummy Smile Treatment",
    ],
  },
  {
    group: "Care",
    items: [
      "Pediatric Dentistry",
      "Sedation Dentistry",
      "Biological Dentistry",
      "Laser Dentistry",
      "TMJ Treatment",
      "Sleep Apnea and Snoring",
      "Gum Disease Treatment",
      "Routine Dental Checkup",
      "Teeth Cleaning",
      "Wisdom Tooth Extraction",
    ],
  },
];

export interface Clinic {
  name: string;
  short: string;
  address: string;
  phone: string;
  image: string;
  maps: string;
}

export const clinics: Clinic[] = [
  {
    name: "Palm Jumeirah Clinic",
    short: "Palm Jumeirah",
    address: "Shop No. 25, Golden Mile, Building No. 7, Palm Jumeirah, Dubai",
    phone: "+971 4 243 5888",
    image: "/location/pic-palm.webp",
    maps: "https://www.google.com/maps/dir//Dr.+Joy+Dental+Clinic,+Palm+Jumeirah+Building+No+7,+Golden+Mile+Palm+7+Palm+Jumeirah+Road+Jumeirah+-+Dubai/@25.1104644,55.1423588,17z",
  },
  {
    name: "Jumeirah Al Wasl Road Clinic",
    short: "Al Wasl Road",
    address: "Villa No. 1021, Al Wasl Road, Umm Suqeim 2, Dubai",
    phone: "+971 4 328 5332",
    image: "/location/img-jumeirah-07-2.webp",
    maps: "https://www.google.com/maps/dir//Dr.+Joy+Dental+Clinic,+Jumeirah+Dubai+(Al+Wasl+Rd)+Villa+No+1021+Al+Wasl+Rd+Jumeirah+-+Umm+Suqeim+2+-+Dubai/@25.1444363,55.2081959,19z",
  },
  {
    name: "Umm Suqeim Pediatric & Orthodontic Center",
    short: "Umm Suqeim",
    address: "Villa No. 1041, Al Wasl Road, Umm Suqeim 2, Dubai",
    phone: "+971 4 346 8333",
    image: "/location/img-umm-suqeim-01-2.webp",
    maps: "https://www.google.com/maps/dir//Dr.+Joy+Dental+Clinic,+Umm+Suqeim+Pediatric+%26+Orthodontic+Center+Villa+No+1041+Al+Wasl+Rd+Al+Manara+-+Dubai/@25.1432605,55.2073637,18z",
  },
  {
    name: "Dubai Hills Mall Clinic",
    short: "Dubai Hills",
    address: "LG001, Lower Ground Floor, Dubai Hills Mall, Al Khail Rd, Dubai",
    phone: "+971 4 320 1307",
    image: "/location/img-dhm-01-1.webp",
    maps: "https://www.google.com/maps/dir//dr+joy+dental+clinic+dubai+hills+mall/@25.0748004,55.1126051,50138m",
  },
  {
    name: "Jumeirah Golf Estates Clinic",
    short: "Golf Estates",
    address: "Retail 17, Al Andalus, Jumeirah Golf Estates, Dubai",
    phone: "800 37569",
    image: "/location/img-jge-01-1.webp",
    maps: "https://www.google.com/maps/dir//Retail+-+17,+Alandalus+-+Jumeirah+Golf+Estates+-+Dubai/@25.0288095,55.1245777,12z",
  },
  {
    name: "Jumeirah Village Circle Clinic",
    short: "JVC",
    address: "RT1007, First Floor, Circle Mall, Jumeirah Village Circle, Dubai",
    phone: "+971 4 579 9871",
    image: "/location/img-banner-v1-1.webp",
    maps: "https://www.google.com/maps/dir//Dr.+Joy+Dental+Clinic,+JVC+RT1007,+First+Floor+Circle+Mall,+JVC+Jumeirah+Village+-+Dubai/@25.0660197,55.2161302,20z",
  },
  {
    name: "Jumeirah Park Clinic",
    short: "Jumeirah Park",
    address: "Jumeirah Park Centre, Shop 07, Al Worood 1 St, Jumeirah Park, Dubai",
    phone: "+971 4 328 5332",
    image: "/location/img-jp-ex1.webp",
    maps: "https://maps.app.goo.gl/nZGUNWydKcisu545A",
  },
  {
    name: "Dubai Marina Clinic",
    short: "Dubai Marina",
    address: "Ground Floor, Shop No. 3, Zen Tower, Dubai Marina, Dubai",
    phone: "+971 4 579 9871",
    image: "/location/img-dubai-marina-banner-01-1.webp",
    maps: "https://www.google.com/maps/dir//Dr.+Joy+Dental+Clinic,+Marina+Dubai+Zen+Tower+Ground+Floor,+Shop+No+3+Dubai+Marina+-+Dubai/@25.0677366,55.1309461,18z",
  },
  {
    name: "Jumeirah Beach Road Clinic",
    short: "Beach Road",
    address: "Villa 17, Jumeirah Beach Road, Jumeirah 1, Dubai",
    phone: "+971 4 579 9871",
    image: "/location/img-beach-road-1-2.webp",
    maps: "https://www.google.com/maps/dir//Dr.+Joy+Dental+Clinic,+Beach+Road+(Jumeirah)+Dubai+Villa+17+Jumeirah+Beach+Rd+Jumeirah+-+Jumeirah+1+-+Dubai/@25.2231869,55.2563778,20z",
  },
  {
    name: "Mirdif Sport Society Clinic",
    short: "Mirdif SSM",
    address: "Unit L2-A-305, Second Floor, Mirdif Sport Society Mall, Dubai",
    phone: "+971 4 257 3867",
    image: "/location/img-mss-1-2.webp",
    maps: "https://www.google.com/maps/dir//Dr.+Joy+Dental+Clinic,+Mirdif+(Sport+Society)+Dubai+Sport+Society+Unit-+L2-A-305+-+Second+Floor+Mirdif+-+Dubai/@25.2220929,55.4082165,18z",
  },
  {
    name: "Dubai Silicon Oasis Clinic",
    short: "Silicon Oasis",
    address: "Unit 13 & 14, Souq Extra, Dubai Silicon Oasis, Dubai",
    phone: "+971 4 320 1307",
    image: "/location/img-dso-out-1.webp",
    maps: "https://www.google.com/maps/dir//Dr.+Joy+Dental+Clinic,+Dubai+Silicon+Oasis+Unit+13+%26+14+Souq+Extra+Dubai+Silicon+Oasis+-+Dubai/@25.1191422,55.3953552,20z",
  },
  {
    name: "BurJuman Mall Clinic",
    short: "BurJuman",
    address: "BurJuman Business Tower, 10th Floor, Office 1003, Bur Dubai",
    phone: "+971 4 355 5357",
    image: "/location/img-burjuman-v1-1.webp",
    maps: "https://www.google.com/maps/dir//Dr.+Joy+Dental+Clinic,+BurJuman+BurJuman,+Business+Tower+Office+1003+10th+Floor+Al+Mankhool+-+Dubai/@25.2515135,55.3013111,20z",
  },
  {
    name: "Mirdif Central Mall Clinic",
    short: "Mirdif Central",
    address: "Central Mall, Ground Floor, Street No. 15, Mirdif, Dubai",
    phone: "+971 4 284 5722",
    image: "/location/img-mirdif-01-2.webp",
    maps: "https://www.google.com/maps/dir//Dr.+Joy+Dental+Clinic,+Mirdif+Central+Mall+Ground+floor,+Central+Mall+15th+St+Mirdif+-+Dubai/@25.2174004,55.4183783,20z",
  },
];

export const testimonials = [
  {
    name: "Stephanie",
    treatment: "Invisalign · Mirdif Sport Society",
    quote:
      "After two unsuccessful treatments at other clinics, Stephanie began Invisalign with our specialist orthodontist Dr Vivek — and finally found the result she had been searching for.",
  },
  {
    name: "May",
    treatment: "Ultra-thin Veneers · In-house Laboratory",
    quote:
      "Unhappy with her small lateral incisors, May visited Dr Ahmed El Sayed. Ultra-thin veneers, crafted by our own technicians, restored proportion and harmony to her smile.",
  },
  {
    name: "Bronwyn",
    treatment: "Full Veneer Smile Design",
    quote:
      "Bronwyn felt held back by her smile. With upper and lower veneers designed by Dr Samar, she left with a flawless smile — and the confidence that comes with it.",
  },
  {
    name: "Negar",
    treatment: "Invisalign · Deep Bite Correction",
    quote:
      "Told everywhere that only years of braces could fix her deep bite, Negar met Dr Vivek — and watched Invisalign transform her smile in under a year.",
  },
  {
    name: "Elaine",
    treatment: "Veneers",
    quote:
      "Elaine Margaret Stewart shares how veneers quietly transformed her dental appearance — and the way she smiles for photographs.",
  },
] as const;

export const founder = {
  name: "Dr. Joy Antony",
  role: "Founder & CEO",
  line: "Twenty-one years ago, one dentist opened one clinic with one conviction — that clinical excellence and genuine warmth belong in the same room.",
} as const;

export const insurers = [
  "Almadallah", "AXA", "Nextcare", "Mednet", "Sukoon",
  "SAICO", "NAS", "NGI", "MSH", "ADNIC",
] as const;

/** Chapter VI — the founder's timeline. Only anchored to facts we can stand behind. */
export const milestones = [
  { marker: "2004", text: "One clinic opens in Dubai. One conviction: excellence and warmth, together." },
  { marker: "·", text: "Recognised with the Superbrands award — a mark of trust, not marketing." },
  { marker: "·", text: "An in-house dental laboratory is built, so quality is never outsourced." },
  { marker: "·", text: "Seven hundred thousand smiles are entrusted to our care." },
  { marker: "Today", text: "Thirteen clinics. One hundred specialists. Every discipline, under one roof." },
] as const;

/** Brand ethos fragments — the practice's voice, floated as quotes in The People. */
export const ethos = [
  "A smile is not treated. It is composed.",
  "Excellence and warmth belong in the same room.",
  "We listen before we ever lift an instrument.",
  "Crafted in our own hands — never ordered out.",
] as const;

export const FRAME_COUNT = 719;
export const frameSrc = (i: number) => `/frame/farmes (${i + 1}).webp`;

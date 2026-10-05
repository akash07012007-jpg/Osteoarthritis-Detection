// District → nearest specialist lookup table
// Placeholder data for North Eastern India (Assam focus)
// Replace with actual district hospital data from NHM Assam records

export interface SpecialistEntry {
  district: string;
  state: string;
  hospital: string;
  address: string;
  type: 'District Hospital' | 'PHC' | 'Medical College' | 'AIIMS';
  orthopedicDays: string; // OPD days
  contact: string;
}

export const DISTRICT_SPECIALIST_MAP: SpecialistEntry[] = [
  {
    district: "Sonitpur",
    state: "Assam",
    hospital: "Tezpur Medical College & Hospital",
    address: "Bihaguri, Tezpur, Sonitpur – 784154",
    type: "Medical College",
    orthopedicDays: "Mon, Wed, Fri (9am–1pm)",
    contact: "03712-234567",
  },
  {
    district: "Sonitpur",
    state: "Assam",
    hospital: "Sonitpur District Hospital",
    address: "Tezpur Town, Sonitpur – 784001",
    type: "District Hospital",
    orthopedicDays: "Mon–Sat (9am–2pm)",
    contact: "03712-220123",
  },
  {
    district: "Kamrup",
    state: "Assam",
    hospital: "Gauhati Medical College & Hospital",
    address: "Bhangagarh, Guwahati, Kamrup – 781032",
    type: "Medical College",
    orthopedicDays: "Mon–Fri (8am–2pm)",
    contact: "0361-2529457",
  },
  {
    district: "Kamrup Metro",
    state: "Assam",
    hospital: "AIIMS Guwahati",
    address: "Changsari, Kamrup – 781101",
    type: "AIIMS",
    orthopedicDays: "Mon–Sat (9am–1pm)",
    contact: "0361-2388000",
  },
  {
    district: "Golaghat",
    state: "Assam",
    hospital: "Golaghat Civil Hospital",
    address: "AT Road, Golaghat – 785621",
    type: "District Hospital",
    orthopedicDays: "Mon, Wed, Fri (9am–1pm)",
    contact: "03774-234500",
  },
  {
    district: "Jorhat",
    state: "Assam",
    hospital: "Jorhat Medical College & Hospital",
    address: "AT Road, Jorhat – 785001",
    type: "Medical College",
    orthopedicDays: "Mon–Fri (8am–2pm)",
    contact: "0376-2322300",
  },
  {
    district: "Nagaon",
    state: "Assam",
    hospital: "Nagaon Civil Hospital",
    address: "Hospital Road, Nagaon – 782001",
    type: "District Hospital",
    orthopedicDays: "Mon, Wed, Sat (10am–1pm)",
    contact: "03672-233456",
  },
  {
    district: "Dibrugarh",
    state: "Assam",
    hospital: "Assam Medical College & Hospital",
    address: "Barbari, Dibrugarh – 786002",
    type: "Medical College",
    orthopedicDays: "Mon–Sat (8am–2pm)",
    contact: "0373-2300119",
  },
  {
    district: "Cachar",
    state: "Assam",
    hospital: "Silchar Medical College & Hospital",
    address: "Ghungoor, Silchar, Cachar – 788014",
    type: "Medical College",
    orthopedicDays: "Mon–Fri (8am–1pm)",
    contact: "03842-225202",
  },
  {
    district: "East Khasi Hills",
    state: "Meghalaya",
    hospital: "Civil Hospital Shillong",
    address: "Laban, Shillong – 793004",
    type: "District Hospital",
    orthopedicDays: "Mon–Fri (9am–1pm)",
    contact: "0364-2223456",
  },
  {
    district: "West Khasi Hills",
    state: "Meghalaya",
    hospital: "Civil Hospital Nongstoin",
    address: "Nongstoin, West Khasi Hills – 793119",
    type: "District Hospital",
    orthopedicDays: "Mon, Wed, Fri (10am–12pm)",
    contact: "03652-230100",
  },
  {
    district: "Kohima",
    state: "Nagaland",
    hospital: "Naga Hospital Authority",
    address: "Near D.C. Court, Kohima – 797001",
    type: "District Hospital",
    orthopedicDays: "Mon–Fri (9am–2pm)",
    contact: "0370-2240560",
  },
  {
    district: "Imphal West",
    state: "Manipur",
    hospital: "Regional Institute of Medical Sciences",
    address: "Lamphelpat, Imphal – 795004",
    type: "Medical College",
    orthopedicDays: "Mon–Sat (8am–2pm)",
    contact: "0385-2414143",
  },
  {
    district: "Aizawl",
    state: "Mizoram",
    hospital: "Civil Hospital Aizawl",
    address: "Zemabawk, Aizawl – 796017",
    type: "District Hospital",
    orthopedicDays: "Mon–Fri (9am–1pm)",
    contact: "0389-2322622",
  },
  {
    district: "East Siang",
    state: "Arunachal Pradesh",
    hospital: "Bakin Pertin General Hospital",
    address: "Pasighat, East Siang – 791102",
    type: "District Hospital",
    orthopedicDays: "Mon, Thu (10am–12pm)",
    contact: "03680-222345",
  },
];

export function lookupSpecialist(district: string, state?: string): SpecialistEntry | null {
  const lower = district.toLowerCase().trim();
  const stateLower = state?.toLowerCase().trim();

  // Exact district match
  let match = DISTRICT_SPECIALIST_MAP.find(
    (e) =>
      e.district.toLowerCase() === lower &&
      (!stateLower || e.state.toLowerCase() === stateLower)
  );

  // Partial match fallback
  if (!match) {
    match = DISTRICT_SPECIALIST_MAP.find((e) =>
      e.district.toLowerCase().includes(lower) ||
      lower.includes(e.district.toLowerCase())
    );
  }

  return match ?? null;
}

export function getAllDistricts(): string[] {
  return [...new Set(DISTRICT_SPECIALIST_MAP.map((e) => e.district))].sort();
}

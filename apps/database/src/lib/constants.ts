export const REGIONS = [
  "Ahafo", "Ashanti", "Bono", "Bono East", "Central", "Eastern", "Greater Accra", "North East",
  "Northern", "Oti", "Savannah", "Upper East", "Upper West", "Volta", "Western", "Western North",
] as const;

export const YEARS = ["100", "200", "300", "400", "500", "600", "Postgraduate", "Alumni"] as const;
export const STATUSES = ["active", "inactive", "alumni", "visitor"] as const;
export const RESIDENCE_TYPES = ["hall", "hostel", "home", "other"] as const;
export const GENDERS = ["male", "female"] as const;

export const PAGE_SIZE = 40;
export const PHOTO_BUCKET = "member-photos";

/** 1 Aug of the current academic year (Aug–Jul). */
export function academicYearStart(now = new Date()) {
  const y = now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1;
  return new Date(y, 7, 1);
}
export function academicYearLabel(now = new Date()) {
  const start = academicYearStart(now).getFullYear();
  return `${start}/${String(start + 1).slice(2)}`;
}

export const STATUS_TONE: Record<string, "good" | "warn" | "mint" | "orange"> = {
  active: "mint", inactive: "warn", alumni: "good", visitor: "orange",
};

/** CSV header → members column. Keys are normalised (lowercase, non-alphanumerics → _). */
export const CSV_COLUMNS = [
  "first_name", "last_name", "other_names", "gender", "dob", "phone", "whatsapp", "email", "programme", "college",
  "year_of_study", "hall", "room", "hometown", "region", "membership_status", "joined_at", "department",
] as const;
export type CsvColumn = (typeof CSV_COLUMNS)[number];

export const CSV_ALIASES: Record<string, CsvColumn> = {
  first_name: "first_name", firstname: "first_name", first: "first_name", given_name: "first_name",
  last_name: "last_name", lastname: "last_name", surname: "last_name", last: "last_name", family_name: "last_name",
  other_names: "other_names", othernames: "other_names", middle_name: "other_names", other_name: "other_names",
  gender: "gender", sex: "gender",
  dob: "dob", date_of_birth: "dob", birthday: "dob", birth_date: "dob",
  phone: "phone", phone_number: "phone", mobile: "phone", tel: "phone", telephone: "phone", contact: "phone",
  whatsapp: "whatsapp", whatsapp_number: "whatsapp",
  email: "email", email_address: "email", mail: "email",
  programme: "programme", program: "programme", course: "programme", course_of_study: "programme",
  college: "college", faculty: "college",
  year_of_study: "year_of_study", year: "year_of_study", level: "year_of_study", year_group: "year_of_study",
  hall: "hall", hall_of_residence: "hall", hostel: "hall", residence: "hall",
  room: "room", room_number: "room", room_no: "room",
  hometown: "hometown", home_town: "hometown",
  region: "region",
  membership_status: "membership_status", status: "membership_status",
  joined_at: "joined_at", joined: "joined_at", date_joined: "joined_at", join_date: "joined_at",
  department: "department", dept: "department", ministry: "department",
};

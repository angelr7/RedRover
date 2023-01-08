const EDUCATION_LEVELS: EDUCATION_LEVEL[] = [
  "Have Not Completed High School",
  "High School",
  "Trade School",
  "Associate's Degree",
  "Bachelor's Degree",
  "Master's Degree",
  "PHD or Higher",
];

type EDUCATION_LEVEL =
  | "Have Not Completed High School"
  | "High School"
  | "Trade School"
  | "Associate's Degree"
  | "Bachelor's Degree"
  | "Master's Degree"
  | "PHD or Higher";

const GENDERS: GENDER[] = ["Female", "Male", "Non-Binary", "Prefer Not To Say"];
type GENDER = "Male" | "Female" | "Non-Binary" | "Prefer Not To Say";

const RACES: RACE[] = [
  "American Indian",
  "Alaska Native",
  "Asian",
  "Black or African American",
  "Native Hawaiian or Other Pacific Islander",
  "White",
  "Other",
];
type RACE =
  | "American Indian"
  | "Alaska Native"
  | "Asian"
  | "Black or African American"
  | "Native Hawaiian or Other Pacific Islander"
  | "White"
  | "Other";

const POLITICAL_AFFILIATION: AFFILIATION[] = [
  "Very Liberal",
  "Slightly Liberal",
  "Moderate",
  "Slightly Conservative",
  "Very Conservative",
];
type AFFILIATION =
  | "Very Liberal"
  | "Slightly Liberal"
  | "Moderate"
  | "Slightly Conservative"
  | "Very Conservative";

const INCOME_LEVELS: INCOME_LEVEL[] = [
  "Less than $25,000",
  "$25,000 - $50,000",
  "$50,000 - $100,000",
  "$100,000 - $200,000",
  "More than $200,000",
];
type INCOME_LEVEL =
  | "Less than $25,000"
  | "$25,000 - $50,000"
  | "$50,000 - $100,000"
  | "$100,000 - $200,000"
  | "More than $200,000";

const JOBS: JOB[] = [
  "Student",
  "Employed (full time)",
  "Employed (part time)",
  "Unemployed (not a student)",
];
type JOB =
  | "Student"
  | "Employed (full time)"
  | "Employed (part time)"
  | "Unemployed (not a student)";

const PETS: PET[] = ["No pets", "Yes, dog", "Yes, cat", "Yes, other"];
type PET = "No pets" | "Yes, dog" | "Yes, cat" | "Yes, other";

const RELIGIONS: RELIGION[] = [
  "Christianity",
  "Judaism",
  "Islam",
  "Buddhism",
  "Hinduism",
  "Not Religious",
  "Other",
];
type RELIGION =
  | "Christianity"
  | "Judaism"
  | "Islam"
  | "Buddhism"
  | "Hinduism"
  | "Not Religious"
  | "Other";

const LIVING_SITUATIONS: LS[] = [
  "Living w/ Parents",
  "Dorm Resident",
  "Homeowner",
  "Lessee",
  "Other",
];
type LS =
  | "Living w/ Parents"
  | "Dorm Resident"
  | "Homeowner"
  | "Renter"
  | "Lessee"
  | "Other";

const convertToEL = (arg: string): EDUCATION_LEVEL => {
  switch (arg) {
    case "Have Not Completed High School":
      return "Have Not Completed High School";
    case "High School":
      return "High School";
    case "Trade School":
      return "Trade School";
    case "Associate's Degree":
      return "Associate's Degree";
    case "Bachelor's Degree":
      return "Bachelor's Degree";
    case "Master's Degree":
      return "Master's Degree";
    default:
      return "PHD or Higher";
  }
};

const convertToGender = (arg: string): GENDER => {
  switch (arg) {
    case "Female":
      return "Female";
    case "Male":
      return "Male";
    case "Non-Binary":
      return "Non-Binary";
    default:
      return "Prefer Not To Say";
  }
};

const convertToString = (arg: any): string => {
  return arg;
};

const convertToRace = (arg: any): RACE => {
  switch (arg) {
    case "Alaska Native":
      return "Alaska Native";
    case "American Indian":
      return "American Indian";
    case "Asian":
      return "Asian";
    case "Black or African American":
      return "Black or African American";
    case "Native Hawaiian or Other Pacific Islander":
      return "Native Hawaiian or Other Pacific Islander";
    case "White":
      return "White";
    default:
      return arg;
  }
};

const getPA = (arg: string): AFFILIATION => {
  switch (arg) {
    case "Very Liberal":
      return "Very Liberal";
    case "Slightly Liberal":
      return "Slightly Liberal";
    case "Slightly Conservative":
      return "Slightly Conservative";
    case "Very Conservative":
      return "Very Conservative";
    default:
      return "Moderate";
  }
};

const convertToIL = (arg: string): INCOME_LEVEL => {
  switch (arg) {
    case "Less than $25,000":
      return "Less than $25,000";
    case "$25,000 - $50,000":
      return "$25,000 - $50,000";
    case "$50,000 - $100,000":
      return "$50,000 - $100,000";
    case "$100,000 - $200,000":
      return "$100,000 - $200,000";
    default:
      return "More than $200,000";
  }
};

const convertToJob = (arg: string): JOB => {
  switch (arg) {
    case "Student":
      return "Student";
    case "Employed (part time)":
      return "Employed (part time)";
    case "Employed (full time)":
      return "Employed (full time)";
    default:
      return "Unemployed (not a student)";
  }
};

const convertToReligion = (arg: string): RELIGION => {
  switch (arg) {
    case "Buddhism":
      return "Buddhism";
    case "Christianity":
      return "Christianity";
    case "Hinduism":
      return "Hinduism";
    case "Islam":
      return "Islam";
    case "Judaism":
      return "Judaism";
    case "Not Religious":
      return "Not Religious";
    default:
      return "Other";
  }
};

const convertToPet = (arg: string): PET => {
  switch (arg) {
    case "Yes, cat":
      return "Yes, cat";
    case "Yes, dog":
      return "Yes, dog";
    case "Yes, other":
      return "Yes, other";
    case "No pets":
      return "No pets";
  }
};

const convertToLS = (arg: string): LS => {
  switch (arg) {
    case "Dorm Resident":
      return "Dorm Resident";
    case "Homeowner":
      return "Homeowner";
    case "Lessee":
      return "Lessee";
    case "Living w/ Parents":
      return "Living w/ Parents";
    case "Renter":
      return "Renter";
    default:
      return "Other";
  }
};

export {
  EDUCATION_LEVELS,
  GENDERS,
  RACES,
  POLITICAL_AFFILIATION,
  INCOME_LEVELS,
  JOBS,
  RELIGIONS,
  PETS,
  LIVING_SITUATIONS,
  convertToEL,
  convertToGender,
  convertToString,
  convertToRace,
  getPA,
  convertToIL,
  convertToJob,
  convertToReligion,
  convertToPet,
  convertToLS,
};
export type {
  EDUCATION_LEVEL,
  GENDER,
  RACE,
  AFFILIATION,
  INCOME_LEVEL,
  JOB,
  RELIGION,
  PET,
  LS,
};

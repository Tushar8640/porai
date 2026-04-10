export const PLAN_STUDENT_LIMITS = {
  FREE: 30,
  BASIC: 150,
  PRO: Infinity,
} as const;

export const PLAN_PRICES = {
  FREE: 0,
  BASIC: 500,
  PRO: 1200,
} as const;

export const BANGLADESH_DISTRICTS = [
  "Bagerhat", "Bandarban", "Barguna", "Barishal", "Bhola",
  "Bogura", "Brahmanbaria", "Chandpur", "Chattogram", "Chuadanga",
  "Cox's Bazar", "Cumilla", "Dhaka", "Dinajpur", "Faridpur",
  "Feni", "Gaibandha", "Gazipur", "Gopalganj", "Habiganj",
  "Jamalpur", "Jashore", "Jhalokati", "Jhenaidah", "Joypurhat",
  "Khagrachhari", "Khulna", "Kishoreganj", "Kurigram", "Kushtia",
  "Lakshmipur", "Lalmonirhat", "Madaripur", "Magura", "Manikganj",
  "Meherpur", "Moulvibazar", "Munshiganj", "Mymensingh", "Naogaon",
  "Narail", "Narayanganj", "Narsingdi", "Natore", "Netrokona",
  "Nilphamari", "Noakhali", "Pabna", "Panchagarh", "Patuakhali",
  "Pirojpur", "Rajbari", "Rajshahi", "Rangamati", "Rangpur",
  "Satkhira", "Shariatpur", "Sherpur", "Sirajganj", "Sunamganj",
  "Sylhet", "Tangail", "Thakurgaon",
] as const;

export const BD_GRADING_SCALE = [
  { min: 80, max: 100, grade: "A+", gpa: 5.0 },
  { min: 70, max: 79,  grade: "A",  gpa: 4.0 },
  { min: 60, max: 69,  grade: "A-", gpa: 3.5 },
  { min: 50, max: 59,  grade: "B",  gpa: 3.0 },
  { min: 40, max: 49,  grade: "C",  gpa: 2.0 },
  { min: 33, max: 39,  grade: "D",  gpa: 1.0 },
  { min: 0,  max: 32,  grade: "F",  gpa: 0.0 },
] as const;

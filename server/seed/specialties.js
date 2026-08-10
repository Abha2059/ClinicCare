/**
 * The 17 ClinicCare specialties.
 * All content is original; the category names follow common healthcare taxonomy.
 */
const specialties = [
  {
    name: 'General Health',
    description:
      'Everyday medical care for common illnesses, preventive checks and long-term condition reviews.',
    conditions: ['Fever', 'Cough & cold', 'Fatigue', 'Headache', 'Seasonal infections', 'Health check-ups'],
  },
  {
    name: 'Child Care',
    description:
      'Paediatric care covering growth and development, childhood illnesses, vaccinations and nutrition.',
    conditions: ['Childhood fever', 'Vaccination schedules', 'Growth concerns', 'Colic', 'Allergies in children'],
  },
  {
    name: 'Skin and Hair Health',
    description:
      'Diagnosis and management of skin, hair and nail concerns, from everyday irritation to chronic conditions.',
    conditions: ['Acne', 'Eczema', 'Hair fall', 'Fungal infections', 'Pigmentation', 'Psoriasis'],
  },
  {
    name: 'Sexual Health',
    description:
      'Confidential consultations covering sexual wellbeing, screening and reproductive health guidance.',
    conditions: ['Sexual wellbeing concerns', 'Screening and testing', 'Contraception advice', 'Fertility guidance'],
  },
  {
    name: 'Digestive and Liver Health',
    description:
      'Care for the digestive tract and liver, including persistent gut symptoms and dietary management.',
    conditions: ['Indigestion', 'Acid reflux', 'Irritable bowel', 'Constipation', 'Fatty liver', 'Gastritis'],
  },
  {
    name: "Women's Health",
    description:
      'Gynaecological and reproductive care across every life stage, from adolescence through menopause.',
    conditions: ['Menstrual irregularity', 'PCOS', 'Pregnancy care', 'Menopause support', 'Pelvic pain'],
  },
  {
    name: 'Kidney Care',
    description:
      'Assessment and long-term management of kidney function, stones and related urinary concerns.',
    conditions: ['Kidney stones', 'Urinary infections', 'Chronic kidney disease', 'Swelling and fluid retention'],
  },
  {
    name: 'Dental Health',
    description:
      'Oral health care covering teeth, gums and routine dental maintenance for adults and children.',
    conditions: ['Toothache', 'Gum disease', 'Cavities', 'Sensitivity', 'Dental cleaning'],
  },
  {
    name: 'Blood Sugar Health',
    description:
      'Diabetes and metabolic care, including monitoring, medication reviews and lifestyle planning.',
    conditions: ['Type 2 diabetes', 'Prediabetes', 'Blood sugar monitoring', 'Thyroid concerns', 'Insulin guidance'],
  },
  {
    name: 'Bone and Joint Health',
    description:
      'Orthopaedic care for bones, joints, muscles and mobility, including injury recovery.',
    conditions: ['Back pain', 'Joint pain', 'Arthritis', 'Sports injuries', 'Fractures', 'Frozen shoulder'],
  },
  {
    name: 'Eye Care',
    description:
      'Eye examinations and treatment for vision changes, irritation and long-term eye conditions.',
    conditions: ['Blurred vision', 'Dry eyes', 'Eye irritation', 'Cataract assessment', 'Glaucoma screening'],
  },
  {
    name: 'ENT',
    description:
      'Ear, nose and throat care covering hearing, sinus problems, and voice or swallowing concerns.',
    conditions: ['Ear pain', 'Sinusitis', 'Sore throat', 'Hearing difficulty', 'Tonsillitis', 'Vertigo'],
  },
  {
    name: 'Heart Health',
    description:
      'Cardiac assessment and long-term care for blood pressure, cholesterol and heart conditions.',
    conditions: ['High blood pressure', 'Chest discomfort', 'High cholesterol', 'Palpitations', 'Heart failure review'],
  },
  {
    name: 'Breathing and Lung Health',
    description:
      'Respiratory care for breathing difficulty, persistent cough and chronic lung conditions.',
    conditions: ['Asthma', 'Breathlessness', 'Chronic cough', 'COPD', 'Chest infections', 'Sleep apnoea'],
  },
  {
    name: 'Elder Care',
    description:
      'Coordinated care for older adults, focusing on mobility, memory, medication reviews and independence.',
    conditions: ['Mobility difficulty', 'Memory concerns', 'Multiple medications', 'Falls prevention', 'Frailty'],
  },
  {
    name: 'Weight Management',
    description:
      'Structured support for healthy weight change through nutrition, activity and medical review.',
    conditions: ['Weight gain', 'Obesity', 'Metabolic health', 'Nutrition planning', 'Weight loss support'],
  },
  {
    name: 'Pain Management',
    description:
      'Assessment and treatment of persistent pain, combining medical, physical and lifestyle approaches.',
    conditions: ['Chronic pain', 'Migraine', 'Neuropathic pain', 'Post-surgical pain', 'Fibromyalgia'],
  },
]

export default specialties

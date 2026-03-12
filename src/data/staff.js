export const staff = [
  {
    id: 1,
    fullName: 'Jessica Adams',
    phone: '0412 345 678',
    email: 'jessica@company.com',
    emergency: { name: 'Peter Adams', relation: 'Husband', phone: '0423 456 789' },
    employment: 'Full Time',
    gender: 'Female',
    dob: '1988-04-12',
    languages: ['English', 'Spanish'],
    title: 'Support Worker',
    status: 'On Shift',
    shifts: 12,
    quals: {
      ndisScreening: { status: 'Valid', expiry: '2025-08-15' },
      wwcc: { status: 'Valid', expiry: '2025-10-20', notApplicable: false },
      firstAid: { status: 'Valid', expiry: '2025-06-20' },
      cpr: { status: 'Expiring Soon', expiry: '2025-02-15' },
      ndisOrientation: { completed: '2024-03-15' },
      policeCheck: { completed: '2024-06-01' },
      insurance: { status: 'Valid', expiry: '2025-12-01' },
      infectionControl: { status: 'Valid', expiry: '2025-09-15' },
      certs: ['Cert III Disability', 'Medication Management']
    },
    onboarding: [
      { id: 1, name: 'Employment Contract', uploaded: '2023-01-15', reviewDate: '2025-01-15', status: 'Review Due' },
      { id: 2, name: 'Employee Handbook', uploaded: '2023-01-15', status: 'Signed' },
      { id: 3, name: 'Code of Conduct', uploaded: '2023-01-15', status: 'Signed' },
      { id: 4, name: 'Job Description', uploaded: '2023-01-15', status: 'Current' },
      { id: 5, name: 'New Staff Checklist', uploaded: '2023-01-15', status: 'Complete' },
      { id: 6, name: 'Staff Induction Checklist', uploaded: '2023-01-20', status: 'Complete' },
      { id: 7, name: 'Skills Assessment Form', uploaded: '2023-02-01', status: 'Complete' },
    ],
    reviews: [
      { id: 1, date: '2024-07-15', reviewer: 'David Park', rating: 'Exceeds Expectations', notes: 'Excellent rapport with participants.' },
      { id: 2, date: '2024-01-10', reviewer: 'David Park', rating: 'Meets Expectations', notes: 'Consistent and reliable.' },
    ],
    nextReview: '2025-07-15',
    unavail: [{ id: 1, start: '2025-02-15', end: '2025-02-22', reason: 'Annual Leave' }],
    staffFeedback: []
  },
  {
    id: 2,
    fullName: 'David Park',
    phone: '0423 456 789',
    email: 'david@company.com',
    emergency: { name: 'Min Park', relation: 'Wife', phone: '0434 567 890' },
    employment: 'Full Time',
    gender: 'Male',
    dob: '1985-09-28',
    languages: ['English', 'Korean'],
    title: 'Team Leader',
    status: 'Available',
    shifts: 8,
    quals: {
      ndisScreening: { status: 'Valid', expiry: '2025-12-01' },
      wwcc: { status: 'Valid', expiry: '2026-03-15', notApplicable: false },
      firstAid: { status: 'Valid', expiry: '2025-11-10' },
      cpr: { status: 'Valid', expiry: '2025-09-10' },
      ndisOrientation: { completed: '2023-08-20' },
      policeCheck: { completed: '2024-01-15' },
      insurance: { status: 'Valid', expiry: '2026-02-01' },
      infectionControl: { status: 'Valid', expiry: '2025-11-30' },
      certs: ['Cert IV Disability', 'Team Leadership']
    },
    onboarding: [
      { id: 1, name: 'Employment Contract', uploaded: '2022-06-01', reviewDate: '2024-06-01', status: 'Current' },
      { id: 2, name: 'Employee Handbook', uploaded: '2022-06-01', status: 'Signed' },
      { id: 3, name: 'Code of Conduct', uploaded: '2022-06-01', status: 'Signed' },
      { id: 4, name: 'Job Description', uploaded: '2022-06-01', status: 'Current' },
      { id: 5, name: 'New Staff Checklist', uploaded: '2022-06-01', status: 'Complete' },
      { id: 6, name: 'Staff Induction Checklist', uploaded: '2022-06-05', status: 'Complete' },
      { id: 7, name: 'Skills Assessment Form', uploaded: '2022-06-15', status: 'Complete' },
    ],
    reviews: [
      { id: 1, date: '2024-09-01', reviewer: 'Admin', rating: 'Exceeds Expectations', notes: 'Strong leadership skills.' }
    ],
    nextReview: '2025-09-01',
    unavail: [],
    staffFeedback: []
  },
  {
    id: 3,
    fullName: 'Maria Garcia',
    phone: '0434 567 890',
    email: 'maria@company.com',
    emergency: { name: 'Carlos Garcia', relation: 'Brother', phone: '0445 678 901' },
    employment: 'Part Time',
    gender: 'Female',
    dob: '1992-12-05',
    languages: ['English', 'Spanish'],
    title: 'Support Worker',
    status: 'Off Duty',
    shifts: 15,
    quals: {
      ndisScreening: { status: 'Expiring Soon', expiry: '2025-04-30' },
      wwcc: { status: 'Expiring Soon', expiry: '2025-03-15', notApplicable: false },
      firstAid: { status: 'Valid', expiry: '2025-08-25' },
      cpr: { status: 'Expired', expiry: '2025-01-15' },
      ndisOrientation: { completed: '2024-01-10' },
      policeCheck: { completed: '2023-11-20' },
      insurance: { status: 'Expiring Soon', expiry: '2025-03-01' },
      infectionControl: { status: 'Expired', expiry: '2025-01-20' },
      certs: ['Cert III Disability']
    },
    onboarding: [
      { id: 1, name: 'Employment Contract', uploaded: '2023-06-01', reviewDate: '2025-06-01', status: 'Current' },
      { id: 2, name: 'Employee Handbook', uploaded: '2023-06-01', status: 'Signed' },
      { id: 3, name: 'Code of Conduct', uploaded: '2023-06-01', status: 'Signed' },
      { id: 4, name: 'Job Description', uploaded: '2023-06-01', status: 'Current' },
      { id: 5, name: 'New Staff Checklist', uploaded: '2023-06-01', status: 'Complete' },
      { id: 6, name: 'Staff Induction Checklist', uploaded: '2023-06-05', status: 'Complete' },
      { id: 7, name: 'Skills Assessment Form', uploaded: '2023-06-15', status: 'Complete' },
    ],
    reviews: [
      { id: 1, date: '2024-06-01', reviewer: 'David Park', rating: 'Meets Expectations', notes: 'Good communication.' }
    ],
    nextReview: '2025-06-01',
    unavail: [{ id: 1, start: '2025-03-01', end: '2025-03-07', reason: 'Personal Leave' }],
    staffFeedback: [{ id: 1, date: '2025-01-20', type: 'Staff Survey', content: 'Would like more training opportunities.' }]
  },
  {
    id: 4,
    fullName: 'Tom Bradley',
    phone: '0445 678 901',
    email: 'tom@company.com',
    emergency: { name: 'Sarah Bradley', relation: 'Sister', phone: '0456 789 012' },
    employment: 'Full Time',
    gender: 'Male',
    dob: '1990-06-18',
    languages: ['English'],
    title: 'Support Coordinator',
    status: 'Available',
    shifts: 6,
    quals: {
      ndisScreening: { status: 'Valid', expiry: '2026-01-20' },
      wwcc: { status: 'Valid', expiry: '2026-05-10', notApplicable: false },
      firstAid: { status: 'Valid', expiry: '2025-10-15' },
      cpr: { status: 'Valid', expiry: '2025-11-05' },
      ndisOrientation: { completed: '2023-05-01' },
      policeCheck: { completed: '2024-03-10' },
      insurance: { status: 'Valid', expiry: '2026-01-15' },
      infectionControl: { status: 'Valid', expiry: '2025-12-01' },
      certs: ['Cert IV Disability', 'Support Coordination']
    },
    onboarding: [
      { id: 1, name: 'Employment Contract', uploaded: '2023-03-01', reviewDate: '2025-03-01', status: 'Review Due' },
      { id: 2, name: 'Employee Handbook', uploaded: '2023-03-01', status: 'Signed' },
      { id: 3, name: 'Code of Conduct', uploaded: '2023-03-01', status: 'Signed' },
      { id: 4, name: 'Job Description', uploaded: '2023-03-01', status: 'Current' },
      { id: 5, name: 'New Staff Checklist', uploaded: '2023-03-01', status: 'Complete' },
      { id: 6, name: 'Staff Induction Checklist', uploaded: '2023-03-05', status: 'Complete' },
      { id: 7, name: 'Skills Assessment Form', uploaded: '2023-03-15', status: 'Complete' },
    ],
    reviews: [],
    nextReview: '2025-05-01',
    unavail: [],
    staffFeedback: []
  },
]

export const getStaffById = (id) => staff.find(s => s.id === parseInt(id))

export const getQualificationAlerts = () => {
  const qualKeys = ['ndisScreening', 'wwcc', 'firstAid', 'cpr', 'insurance', 'infectionControl']
  return staff.reduce((acc, s) => {
    qualKeys.forEach(k => {
      if (s.quals[k]?.status && s.quals[k].status !== 'Valid') acc++
    })
    return acc
  }, 0)
}

export const timesheetData = [
  { staffId: 1, staffName: 'Jessica Adams', week: '2025-02-03', mon: 6, tue: 6, wed: 6, thu: 0, fri: 6, sat: 0, sun: 0, total: 24 },
  { staffId: 2, staffName: 'David Park', week: '2025-02-03', mon: 4, tue: 4, wed: 0, thu: 4, fri: 4, sat: 4, sun: 0, total: 20 },
  { staffId: 3, staffName: 'Maria Garcia', week: '2025-02-03', mon: 0, tue: 4, wed: 4, thu: 0, fri: 4, sat: 0, sun: 0, total: 12 },
  { staffId: 4, staffName: 'Tom Bradley', week: '2025-02-03', mon: 4, tue: 0, wed: 4, thu: 4, fri: 0, sat: 0, sun: 0, total: 12 },
]

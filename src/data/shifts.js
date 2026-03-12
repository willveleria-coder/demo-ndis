export const shifts = [
  {
    id: 1,
    pId: 1,
    participant: 'Sarah Mitchell',
    wId: 1,
    worker: 'Jessica Adams',
    dateLabel: 'Today',
    date: '2025-02-05',
    time: '9:00 AM - 3:00 PM',
    service: 'Daily Living',
    status: 'In Progress',
    location: '12 Smith St, Melbourne',
    details: 'Morning routine assistance, lunch preparation, afternoon walk to park',
    clockIn: '08:58',
    clockOut: null,
    mileage: { start: 45230, end: null, total: null },
    noteStatus: 'Pending',
    noteDue: '2025-02-06'
  },
  {
    id: 2,
    pId: 2,
    participant: 'James Wilson',
    wId: 2,
    worker: 'David Park',
    dateLabel: 'Today',
    date: '2025-02-05',
    time: '2:00 PM - 6:00 PM',
    service: 'Community Access',
    status: 'Upcoming',
    location: '45 Jones Rd, Carlton',
    details: 'Grocery shopping, community centre visit',
    clockIn: null,
    clockOut: null,
    mileage: { start: null, end: null, total: null },
    noteStatus: null,
    noteDue: null
  },
  {
    id: 3,
    pId: 3,
    participant: 'Emma Thompson',
    wId: 3,
    worker: 'Maria Garcia',
    dateLabel: 'Tomorrow',
    date: '2025-02-06',
    time: '8:00 AM - 12:00 PM',
    service: 'Transport',
    status: 'Scheduled',
    location: '78 Brown Ave, Richmond',
    details: 'Medical appointment at Royal Melbourne Hospital at 9:30 AM',
    clockIn: null,
    clockOut: null,
    mileage: { start: null, end: null, total: null },
    noteStatus: null,
    noteDue: null
  },
  {
    id: 4,
    pId: 4,
    participant: 'Michael Chen',
    wId: 4,
    worker: 'Tom Bradley',
    dateLabel: 'Tomorrow',
    date: '2025-02-06',
    time: '1:00 PM - 5:00 PM',
    service: 'Employment Support',
    status: 'Scheduled',
    location: '23 Green St, Fitzroy',
    details: 'Resume workshop and interview preparation',
    clockIn: null,
    clockOut: null,
    mileage: { start: null, end: null, total: null },
    noteStatus: null,
    noteDue: null
  },
  {
    id: 5,
    pId: 1,
    participant: 'Sarah Mitchell',
    wId: 1,
    worker: 'Jessica Adams',
    dateLabel: 'Yesterday',
    date: '2025-02-04',
    time: '9:00 AM - 3:00 PM',
    service: 'Daily Living',
    status: 'Completed',
    location: '12 Smith St, Melbourne',
    details: 'Morning routine, medication admin, grocery shopping',
    clockIn: '08:55',
    clockOut: '15:05',
    mileage: { start: 45200, end: 45218, total: 18 },
    noteStatus: 'Completed',
    noteDue: '2025-02-05'
  },
  {
    id: 6,
    pId: 2,
    participant: 'James Wilson',
    wId: 2,
    worker: 'David Park',
    dateLabel: 'Yesterday',
    date: '2025-02-04',
    time: '10:00 AM - 2:00 PM',
    service: 'Therapy Services',
    status: 'Completed',
    location: '45 Jones Rd, Carlton',
    details: 'Physio session and exercises',
    clockIn: '09:58',
    clockOut: '14:02',
    mileage: { start: 32100, end: 32115, total: 15 },
    noteStatus: 'Completed',
    noteDue: '2025-02-05'
  },
]

export const getShiftById = (id) => shifts.find(s => s.id === parseInt(id))

export const getShiftsByParticipant = (pId) => shifts.filter(s => s.pId === parseInt(pId))

export const getShiftsByStaff = (wId) => shifts.filter(s => s.wId === parseInt(wId))

export const notes = [
  {
    id: 1,
    pId: 1,
    participant: 'Sarah Mitchell',
    worker: 'Jessica Adams',
    date: '2025-02-04',
    status: 'Completed',
    content: 'Shift went well. Sarah was in good spirits. Assisted with breakfast preparation - she is becoming more independent. Medication administered as per chart at 10am. Went for a walk to the local park in the afternoon.',
    due: null,
    prompts: {
      mood: 'Happy and engaged',
      goals: 'Practiced cooking skills independently',
      challenges: 'None today',
      nextSteps: 'Continue encouraging meal prep independence'
    }
  },
  {
    id: 2,
    pId: 1,
    participant: 'Sarah Mitchell',
    worker: 'Jessica Adams',
    date: '2025-02-05',
    status: 'Pending',
    content: null,
    due: '2025-02-06',
    prompts: null
  },
  {
    id: 3,
    pId: 2,
    participant: 'James Wilson',
    worker: 'David Park',
    date: '2025-02-04',
    status: 'Completed',
    content: 'Physio exercises completed. James showed improvement in mobility. Discussed upcoming community activities.',
    due: null,
    prompts: {
      mood: 'Motivated',
      goals: 'Completed all physio exercises',
      challenges: 'Mild discomfort during stretches',
      nextSteps: 'Follow up with physiotherapist next week'
    }
  },
]

export const NOTE_PROMPTS = [
  'How was the participant\'s mood and engagement today?',
  'What goals or activities were worked on during this shift?',
  'Were there any challenges, concerns, or incidents?',
  'What are the recommended next steps?'
]

export const shiftFormsList = [
  { name: 'Daily Progress Note', desc: 'Standard shift documentation', mandatory: true },
  { name: 'Medication Administration', desc: 'Record medication given', mandatory: true },
  { name: 'Incident Report', desc: 'Document any incidents', mandatory: false },
  { name: 'Community Access Log', desc: 'Outings and activities', mandatory: false },
  { name: 'Mileage Record', desc: 'Vehicle travel tracking', mandatory: false },
  { name: 'Behaviour Support Note', desc: 'BSP participant notes', mandatory: false },
]


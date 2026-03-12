export const SERVICES_LIST = [
  'Daily Living',
  'Community Access',
  'Transport',
  'Supported Independent Living (SIL)',
  'Therapy Services',
  'Employment Support',
  'Respite Care',
  'Behaviour Support',
  'Social & Community Participation',
  'Plan Management'
]

export const DOCUMENT_TYPES = [
  'Support Plan',
  'Emergency Plan',
  'Intake Form',
  'Service Agreement',
  'Consent Forms',
  'Participant Handbook',
  'Individual Risk Assessment',
  'Detailed Risk Assessment',
  'Home Safety Checklist',
  'Support Matching Assessment',
  'Medication Management Plan',
  'Mealtime Management Plan',
  'Manual Handling Plan'
]

export const participants = [
  {
    id: 1,
    fullName: 'Sarah Mitchell',
    ndisNumber: '431245678901',
    phone: '0412 345 678',
    email: 'sarah.m@email.com',
    address: '12 Smith St, Melbourne VIC 3000',
    gender: 'Female',
    dob: '1990-03-15',
    age: 34,
    maritalStatus: 'Single',
    religion: 'None',
    nationality: 'Australian',
    languages: ['English'],
    emergency: { name: 'John Mitchell', relation: 'Brother', phone: '0423 456 789' },
    funding: 'Plan Managed',
    planManager: 'Plan Partners',
    coordinator: { name: 'Jane Smith', phone: '0434 567 890', email: 'jane@support.com' },
    services: ['Daily Living', 'Community Access', 'Transport', 'Behaviour Support'],
    hasBSP: true,
    documents: [
      { id: 1, name: 'Support Plan', status: 'Expiring Soon', expiry: '2025-02-28', visible: true, visibleTo: [1, 3], archived: false, category: 'support' },
      { id: 2, name: 'Emergency Plan', status: 'Valid', expiry: '2025-12-15', visible: true, visibleTo: [1], archived: false, category: 'support' },
      { id: 3, name: 'Intake Form', status: 'Valid', expiry: '2026-01-15', visible: false, visibleTo: [], archived: false, category: 'intake' },
      { id: 4, name: 'Service Agreement', status: 'Valid', expiry: '2025-12-15', visible: true, visibleTo: [1, 2, 3], archived: false, category: 'agreement' },
      { id: 5, name: 'Consent Forms', status: 'Valid', expiry: '2025-11-30', visible: true, visibleTo: [1], archived: false, category: 'consent' },
      { id: 6, name: 'Participant Handbook', status: 'Valid', expiry: '2026-06-01', visible: true, visibleTo: [1, 2, 3, 4], archived: false, category: 'handbook' },
      { id: 7, name: 'Individual Risk Assessment', status: 'Expired', expiry: '2025-01-15', visible: false, visibleTo: [], archived: false, category: 'risk' },
      { id: 8, name: 'Detailed Risk Assessment', status: 'Valid', expiry: '2025-10-20', visible: true, visibleTo: [1], archived: false, category: 'risk' },
      { id: 9, name: 'Home Safety Checklist', status: 'Valid', expiry: '2025-09-15', visible: true, visibleTo: [1, 3], archived: false, category: 'safety' },
      { id: 10, name: 'Support Matching Assessment', status: 'Valid', expiry: '2025-08-30', visible: false, visibleTo: [], archived: false, category: 'assessment' },
      { id: 11, name: 'Medication Management Plan', status: 'Valid', expiry: '2025-07-01', visible: true, visibleTo: [1], archived: false, category: 'other' },
      { id: 12, name: 'Mealtime Management Plan', status: 'Valid', expiry: '2025-11-15', visible: true, visibleTo: [1, 3], archived: false, category: 'other' },
    ],
    archivedDocs: [
      { id: 101, name: 'Service Agreement (2023)', status: 'Archived', expiry: '2024-06-15', archivedDate: '2024-06-20', category: 'agreement' },
      { id: 102, name: 'Risk Assessment (2023)', status: 'Archived', expiry: '2024-01-10', archivedDate: '2024-01-15', category: 'risk' },
    ],
    shiftForms: [
      { id: 1, name: 'Medication Chart', date: '2025-02-03', worker: 'Jessica Adams', type: 'medication' },
      { id: 2, name: 'Incident Report', date: '2025-01-28', worker: 'Jessica Adams', type: 'incident' },
    ],
    status: 'Active'
  },
  {
    id: 2,
    fullName: 'James Wilson',
    ndisNumber: '439876543210',
    phone: '0423 456 789',
    email: 'james.w@email.com',
    address: '45 Jones Rd, Carlton VIC 3053',
    gender: 'Male',
    dob: '1996-07-22',
    age: 28,
    maritalStatus: 'Married',
    religion: 'Christian',
    nationality: 'Australian',
    languages: ['English', 'Mandarin'],
    emergency: { name: 'Lisa Wilson', relation: 'Wife', phone: '0434 567 890' },
    funding: 'Self Managed',
    planManager: null,
    coordinator: { name: 'Mark Davis', phone: '0445 678 901', email: 'mark@coord.com' },
    services: ['Supported Independent Living (SIL)', 'Therapy Services', 'Respite Care'],
    hasBSP: true,
    documents: [
      { id: 1, name: 'Service Agreement', status: 'Valid', expiry: '2025-11-30', visible: true, visibleTo: [2, 4], archived: false, category: 'agreement' },
      { id: 2, name: 'Support Plan', status: 'Valid', expiry: '2025-10-15', visible: true, visibleTo: [2], archived: false, category: 'support' },
      { id: 3, name: 'Consent Forms', status: 'Valid', expiry: '2025-12-01', visible: true, visibleTo: [2], archived: false, category: 'consent' },
      { id: 4, name: 'Individual Risk Assessment', status: 'Valid', expiry: '2025-09-20', visible: true, visibleTo: [2, 4], archived: false, category: 'risk' },
      { id: 5, name: 'Participant Handbook', status: 'Valid', expiry: '2026-03-01', visible: true, visibleTo: [2, 4], archived: false, category: 'handbook' },
    ],
    archivedDocs: [],
    shiftForms: [],
    status: 'Active'
  },
  {
    id: 3,
    fullName: 'Emma Thompson',
    ndisNumber: '435678901234',
    phone: '0434 567 890',
    email: 'emma.t@email.com',
    address: '78 Brown Ave, Richmond VIC 3121',
    gender: 'Female',
    dob: '1979-11-08',
    age: 45,
    maritalStatus: 'Divorced',
    religion: 'Buddhist',
    nationality: 'British',
    languages: ['English', 'French'],
    emergency: { name: 'Sophie Thompson', relation: 'Daughter', phone: '0445 678 901' },
    funding: 'NDIA Managed',
    planManager: null,
    coordinator: { name: 'Lisa Brown', phone: '0456 789 012', email: 'lisa@ndis.com' },
    services: ['Daily Living', 'Transport', 'Social & Community Participation', 'Plan Management'],
    hasBSP: false,
    documents: [
      { id: 1, name: 'Service Agreement', status: 'Expiring Soon', expiry: '2025-02-20', visible: true, visibleTo: [3], archived: false, category: 'agreement' },
      { id: 2, name: 'Support Plan', status: 'Valid', expiry: '2025-08-15', visible: true, visibleTo: [3], archived: false, category: 'support' },
      { id: 3, name: 'Intake Form', status: 'Valid', expiry: '2026-02-01', visible: false, visibleTo: [], archived: false, category: 'intake' },
      { id: 4, name: 'Home Safety Checklist', status: 'Expiring Soon', expiry: '2025-03-01', visible: true, visibleTo: [3], archived: false, category: 'safety' },
    ],
    archivedDocs: [
      { id: 101, name: 'Service Agreement (2023)', status: 'Archived', expiry: '2024-02-15', archivedDate: '2024-02-20', category: 'agreement' }
    ],
    shiftForms: [],
    status: 'Active'
  },
  {
    id: 4,
    fullName: 'Michael Chen',
    ndisNumber: '432345678901',
    phone: '0445 678 901',
    email: 'michael.c@email.com',
    address: '23 Green St, Fitzroy VIC 3065',
    gender: 'Male',
    dob: '2002-05-30',
    age: 22,
    maritalStatus: 'Single',
    religion: 'None',
    nationality: 'Australian',
    languages: ['English', 'Cantonese'],
    emergency: { name: 'Wei Chen', relation: 'Father', phone: '0456 789 012' },
    funding: 'Plan Managed',
    planManager: 'My Plan Manager',
    coordinator: { name: 'Jane Smith', phone: '0434 567 890', email: 'jane@support.com' },
    services: ['Community Access', 'Employment Support', 'Therapy Services', 'Behaviour Support', 'Social & Community Participation'],
    hasBSP: true,
    documents: [
      { id: 1, name: 'Service Agreement', status: 'Valid', expiry: '2026-01-15', visible: true, visibleTo: [4], archived: false, category: 'agreement' },
      { id: 2, name: 'Support Plan', status: 'Valid', expiry: '2025-12-01', visible: true, visibleTo: [4], archived: false, category: 'support' },
      { id: 3, name: 'Consent Forms', status: 'Valid', expiry: '2025-11-15', visible: true, visibleTo: [4], archived: false, category: 'consent' },
      { id: 4, name: 'Individual Risk Assessment', status: 'Valid', expiry: '2025-10-01', visible: true, visibleTo: [4], archived: false, category: 'risk' },
      { id: 5, name: 'Manual Handling Plan', status: 'Valid', expiry: '2025-09-15', visible: true, visibleTo: [4], archived: false, category: 'other' },
    ],
    archivedDocs: [],
    shiftForms: [],
    status: 'Active'
  },
]

export const getParticipantById = (id) => participants.find(p => p.id === parseInt(id))

export const getExpiringDocuments = () => {
  return participants.reduce((acc, p) => {
    const expiring = p.documents.filter(d => d.status !== 'Valid')
    return acc + expiring.length
  }, 0)
}

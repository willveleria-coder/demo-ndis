export const feedback = [
  {
    id: 1,
    type: 'Feedback',
    from: 'Sarah Mitchell',
    anon: false,
    method: 'Form',
    date: '2025-01-30',
    desc: 'Very happy with Jessica\'s support. Always punctual and caring.',
    actionRequired: 'No action needed - positive feedback noted.',
    followUpRequired: false,
    followUpDate: null,
    status: 'Acknowledged',
    formUploaded: true
  },
  {
    id: 2,
    type: 'Complaint',
    from: 'Anonymous',
    anon: true,
    method: 'Verbal',
    date: '2025-01-28',
    desc: 'Concerns about shift timing. Worker arrived 20 minutes late on multiple occasions.',
    actionRequired: 'Review worker timesheets. Schedule meeting with worker.',
    followUpRequired: true,
    followUpDate: '2025-02-10',
    status: 'Action Required',
    formUploaded: false
  },
  {
    id: 3,
    type: 'Feedback',
    from: 'Wei Chen (Father of Michael)',
    anon: false,
    method: 'Form',
    date: '2025-02-01',
    desc: 'Appreciates the employment support program. Michael is making great progress.',
    actionRequired: 'Share with support team.',
    followUpRequired: false,
    followUpDate: null,
    status: 'Acknowledged',
    formUploaded: true
  },
]

export const getFeedbackById = (id) => feedback.find(f => f.id === parseInt(id))

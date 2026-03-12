export const incidents = [
  {
    id: 1,
    type: 'Near Miss',
    participant: 'Sarah Mitchell',
    pId: 1,
    reporter: 'Jessica Adams',
    wId: 1,
    date: '2025-01-28',
    desc: 'Participant almost slipped on wet floor in bathroom.',
    reportable: false,
    status: 'Under Review',
    priority: 'Medium',
    mgmt: {
      receivedDate: '2025-01-28',
      receivedBy: 'David Park',
      involvedParties: ['Sarah Mitchell', 'Jessica Adams'],
      category: 'near-miss',
      isReportable: false,
      timeframe: null,
      actionPlan: 'Review bathroom safety. Install non-slip mats.',
      resolution: 'Preventive measures',
      resolutionTimeframe: '2025-02-10',
      responsiblePerson: 'David Park',
      followUp: null,
      outcome: null
    }
  },
  {
    id: 2,
    type: 'Incident',
    participant: 'James Wilson',
    pId: 2,
    reporter: 'David Park',
    wId: 2,
    date: '2025-01-25',
    desc: 'Minor verbal altercation during community outing. Participant became agitated at shopping centre.',
    reportable: false,
    status: 'Resolved',
    priority: 'Low',
    mgmt: {
      receivedDate: '2025-01-25',
      receivedBy: 'Admin',
      involvedParties: ['James Wilson', 'David Park'],
      category: 'incident',
      isReportable: false,
      timeframe: null,
      actionPlan: 'Debrief with participant. Review triggers.',
      resolution: 'Resolved through discussion',
      resolutionTimeframe: '2025-01-30',
      responsiblePerson: 'David Park',
      followUp: '2025-02-01',
      outcome: 'Participant identified triggers. Updated support plan.'
    }
  },
  {
    id: 3,
    type: 'Concern',
    participant: 'Emma Thompson',
    pId: 3,
    reporter: 'Maria Garcia',
    wId: 3,
    date: '2025-01-30',
    desc: 'Unauthorised restrictive practice used — participant was physically redirected without authorisation under BSP.',
    reportable: true,
    timeframe: '5 days',
    due: '2025-02-06',
    status: 'Action Required',
    priority: 'High',
    mgmt: {
      receivedDate: '2025-01-30',
      receivedBy: 'Admin',
      involvedParties: ['Emma Thompson', 'Maria Garcia'],
      category: 'concern',
      isReportable: true,
      timeframe: '5 days',
      actionPlan: 'Report to NDIS Commission. Review staff training on restrictive practices.',
      resolution: null,
      resolutionTimeframe: '2025-02-06',
      responsiblePerson: 'Admin',
      followUp: null,
      outcome: null
    }
  },
]

export const getIncidentById = (id) => incidents.find(i => i.id === parseInt(id))

export const INCIDENT_CATEGORIES = [
  { value: 'hazard', label: 'Hazard' },
  { value: 'near-miss', label: 'Near Miss' },
  { value: 'incident', label: 'Incident' },
  { value: 'concern', label: 'Concern / Change' },
]

export const REPORTABLE_TIMEFRAMES = [
  { value: 'no', label: 'No' },
  { value: 'yes-24', label: 'Yes — 24 Hours' },
  { value: 'yes-5', label: 'Yes — 5 Business Days' },
]

export const REPORTABLE_24HR = [
  'Death of a person with disability',
  'Serious injury',
  'Abuse or neglect',
  'Unlawful physical contact or assault',
  'Sexual misconduct (including grooming)',
  'Unauthorised restrictive practice causing harm'
]

export const REPORTABLE_5DAY = [
  'Unauthorised use of a restrictive practice that did not result in harm to the person with disability'
]

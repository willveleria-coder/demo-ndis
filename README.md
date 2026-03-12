# NDIS CRM by Veleria

A comprehensive NDIS (National Disability Insurance Scheme) Customer Relationship Management system built with React, Vite, and Tailwind CSS.

## Features

### Participants
- Complete profile management (personal details, emergency contacts, funding, support coordinator)
- Document management with expiry tracking and worker visibility controls
- Archived documents section
- Shift forms stored per participant for admin tracking

### Staff
- Full profile and employment details
- Qualification tracking (NDIS screening, WWCC, First Aid, CPR, Insurance, Infection Control)
- Onboarding documents with review dates
- Performance reviews with history
- Unavailability management (3-hour cutoff rule)
- Staff-specific forms (complaints, surveys)

### Rostering
- Shift scheduling with date, time, location, and service details
- Clock in/out tracking
- Mileage tracking (start/end odometer, total km)
- Mandatory shift notes with 24-hour deadline
- Guided note prompts
- Weekly timesheet summary per employee

### Incident Management
- Full incident logging and tracking
- NDIS reportable incident identification (24hr / 5 day requirements)
- Management questionnaire workflow
- Action plan with resolution timeframe and responsible person
- Follow-up and outcome tracking

### Feedback & Complaints
- Feedback and complaint submission
- Anonymous option
- Verbal or form submission tracking
- Action required and follow-up tracking

### AI Assistant
- Quick compliance queries
- Document status summaries
- Staff qualification overviews
- Shift information

## Tech Stack

- **React 18** - UI framework
- **React Router 6** - Client-side routing
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Lucide React** - Icons

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
src/
├── components/
│   └── ui/           # Shared UI components (Badge, Modal, StatCard, etc.)
├── data/             # Demo data files
│   ├── participants.js
│   ├── staff.js
│   ├── shifts.js
│   ├── incidents.js
│   ├── feedback.js
│   └── forms.js
├── layouts/
│   └── MainLayout.jsx  # Main app layout with sidebar navigation
├── pages/            # Route pages
│   ├── Dashboard.jsx
│   ├── Participants.jsx
│   ├── ParticipantDetail.jsx
│   ├── Staff.jsx
│   ├── StaffDetail.jsx
│   ├── Roster.jsx
│   ├── ShiftDetail.jsx
│   ├── Incidents.jsx
│   ├── IncidentDetail.jsx
│   ├── Feedback.jsx
│   ├── Notes.jsx
│   ├── AIAssistant.jsx
│   └── Settings.jsx
├── App.jsx           # Main app with routing
├── main.jsx          # Entry point
└── index.css         # Global styles
```

## Routes

| Path | Component | Description |
|------|-----------|-------------|
| `/` | Dashboard | Overview stats and quick actions |
| `/participants` | Participants | List all participants |
| `/participants/:id` | ParticipantDetail | Single participant profile |
| `/staff` | Staff | List all staff |
| `/staff/:id` | StaffDetail | Single staff profile |
| `/roster` | Roster | Shift schedule and timesheets |
| `/roster/shift/:id` | ShiftDetail | Single shift details |
| `/incidents` | Incidents | Incident management |
| `/incidents/:id` | IncidentDetail | Single incident details |
| `/feedback` | Feedback | Feedback & complaints |
| `/notes` | Notes | Shift notes & forms |
| `/ai` | AIAssistant | AI helper |
| `/settings` | Settings | System configuration |

## License

MIT

# Trebound Workflow Management System
## Documentation & Specifications

---

## Table of Contents
1. [System Overview](#system-overview)
2. [Data Model](#data-model)
3. [Stage Definitions](#stage-definitions)
4. [Field Specifications](#field-specifications)
5. [Validation Rules](#validation-rules)
6. [Automation Logic](#automation-logic)
7. [User Roles & Permissions](#user-roles--permissions)
8. [Reporting & Analytics](#reporting--analytics)

---

## System Overview

### Purpose
A workflow management system designed to streamline Trebound's program delivery process from sales handover through final closure, ensuring quality control and accountability at each stage.

### Key Features
- **5-Stage Pipeline**: Handover → Feasibility → Delivery → Post-Delivery → Done
- **Gate-Based Progression**: Cards cannot advance without meeting exit criteria
- **Role-Based Access**: Sales, Ops, Finance, and Admin roles
- **Audit Trail**: Complete history of changes and approvals
- **Automated Notifications**: Email/SMS alerts at key milestones
- **Reporting Dashboard**: Real-time analytics and performance metrics

### Technology Stack
- **Frontend**: React.js with Tailwind CSS
- **Backend**: Node.js/Express or serverless functions
- **Database**: PostgreSQL or MongoDB
- **File Storage**: AWS S3 or similar
- **Authentication**: JWT-based auth

---

## Data Model

### Core Entities

#### 1. Program Card
```javascript
{
  // Unique Identifiers
  programId: String (Auto-generated, e.g., "TRB-2024-001"),
  cardId: String (UUID),
  
  // Metadata
  createdAt: DateTime,
  updatedAt: DateTime,
  currentStage: Enum [1, 2, 3, 4, 5],
  stageHistory: Array<StageTransition>,
  
  // Stage 1 Data
  stage1: {
    // Core Program Details
    programName: String,
    programType: Enum ["E2E", "Day", "Virtual", "OBL"],
    programDates: Array<Date>,
    programTimings: String,
    location: String,
    minPax: Number,
    maxPax: Number,
    trainingDays: Number,
    
    // Client & Sales
    salesPOC: String,
    clientPOC: {
      name: String,
      phone: String,
      email: String
    },
    companyName: String,
    companyAddress: String,
    previousEngagement: Boolean,
    previousEngagementNotes: String,
    
    // Program Content
    activityType: Enum ["OTS", "OBL", "Custom"],
    activitiesCommitted: Array<String>,
    objectives: Array<String>,
    objectiveDocuments: Array<FileReference>,
    agendaDocument: FileReference (mandatory),
    
    // Commercials
    deliveryBudget: Number,
    billingDetails: String,
    photoVideoCommitment: Boolean,
    
    // Venue & Logistics
    venuePOC: String,
    specialVenueRequirements: String,
    eventVendorDetails: String,
    
    // Exit Criteria
    opsSPOC: String,
    financeApprovalReceived: Boolean,
    financeApprovalEmail: FileReference,
    handoverAcceptedByOps: Boolean,
    handoverIssues: String
  },
  
  // Stage 2 Data
  stage2: {
    // Resource Blocking
    facilitatorsBlocked: Array<String>,
    helperStaffBlocked: Array<String>,
    transportBlocked: String,
    
    // Program Planning
    agendaWalkthroughDone: Boolean,
    valueAddsFinalized: Array<String>,
    deliverablesConfirmed: Array<String>,
    
    // Logistics & Travel
    gameAvailabilityConfirmed: Boolean,
    activityAreaConfirmed: Boolean,
    travelPlanFinalized: Boolean,
    logisticsList: FileReference,
    procurementRequired: Boolean,
    procurementDetails: String,
    
    // Client Communication
    welcomeEmailSent: Boolean,
    welcomeEmailDate: DateTime,
    
    // Attachments
    agendaDocument: FileReference,
    logisticsListDocument: FileReference,
    travelPlanDocument: FileReference,
    
    // Exit Criteria
    allResourcesBlocked: Boolean,
    logisticsListLocked: Boolean,
    prepComplete: Boolean
  },
  
  // Stage 3 Data
  stage3: {
    // Pre-Delivery
    packingCheckDone: Boolean,
    packingOwner: String,
    packingDelays: Boolean,
    packingDelayReason: String,
    
    // On-Ground
    setupOnTime: Boolean,
    setupIssues: String,
    activitiesExecuted: Array<String>,
    actualParticipantCount: Number,
    medicalIssues: Boolean,
    medicalIssueDetails: String,
    
    // Notes
    facilitatorRemarks: String,
    bdLeadGenDone: Boolean,
    bdLeadGenDetails: String,
    
    // Attachments
    photosVideos: Array<FileReference>,
    tripExpenseSheet: FileReference (mandatory)
  },
  
  // Stage 4 Data
  stage4: {
    // Client & Feedback
    googleReviewReceived: Boolean,
    googleReviewLink: String,
    videoTestimonialReceived: Boolean,
    videoTestimonialFile: FileReference,
    mediaSharedWithClient: Boolean,
    
    // Ops Closure
    opsDataManagerUpdated: Boolean,
    opsDataManagerLink: String,
    expensesBillsSubmitted: Boolean,
    opsSummaryShared: Boolean,
    
    // Logistics Reset
    unpackingDone: Boolean,
    damageMissingItems: Boolean,
    damageMissingDetails: String,
    itemsSentForCleaning: Boolean,
    firstAidCheckDone: Boolean,
    
    // Quality Rating
    zfdRating: Number (1-5),
    zfdComments: String (mandatory if ≤3)
  },
  
  // Stage 5 - Done
  stage5: {
    closedAt: DateTime,
    closedBy: String,
    finalNotes: String
  }
}
```

#### 2. User
```javascript
{
  userId: String (UUID),
  name: String,
  email: String,
  phone: String,
  role: Enum ["Sales", "Ops", "Finance", "Admin"],
  active: Boolean,
  createdAt: DateTime
}
```

#### 3. StageTransition
```javascript
{
  fromStage: Number,
  toStage: Number,
  transitionedAt: DateTime,
  transitionedBy: String (userId),
  approvalNotes: String
}
```

---

## Stage Definitions

### Stage 1: Handover + Approval

**Purpose**: Transfer program ownership from Sales to Operations with complete information and financial approval.

**Owner**: Sales (input) → Finance (approval) → Ops (acceptance)

**Key Actions**:
- Sales fills all mandatory program details
- Finance reviews and approves budget
- Ops reviews and accepts handover

**Exit Criteria** (ALL must be YES):
- [ ] Ops SPOC assigned
- [ ] Finance approval received
- [ ] Handover accepted by Ops
- [ ] No blocking issues reported

**Cannot Progress If**:
- Finance approval = NO
- Handover accepted = NO
- Mandatory fields incomplete

---

### Stage 2: Feasibility + Program Preps

**Purpose**: Confirm resource availability, finalize logistics, and complete all pre-program preparations.

**Owner**: Operations Team

**Key Actions**:
- Block all required resources (facilitators, staff, transport)
- Confirm game and venue availability
- Create detailed logistics list
- Finalize travel plans
- Send welcome email to client

**Exit Criteria** (ALL must be YES):
- [ ] All resources blocked
- [ ] Logistics list locked and approved
- [ ] Ops "Prep Complete" checkbox = YES

**Cannot Progress If**:
- Resources not fully blocked
- Logistics list not finalized
- Prep complete checkbox unchecked

---

### Stage 3: Delivery (On-Day Execution)

**Purpose**: Execute the program and document all on-ground activities.

**Owner**: Facilitator + On-Ground Team

**Key Actions**:
- Complete pre-delivery packing checklist
- Execute program activities
- Document participant count and any incidents
- Submit trip expense sheet
- Capture photos/videos if committed

**Exit Criteria**:
- [ ] Trip expense sheet uploaded (mandatory)
- [ ] All on-ground checklist items completed

**Auto-Advances To Stage 4**: Upon completion of delivery day activities

---

### Stage 4: Post Delivery & Closure

**Purpose**: Complete all post-program activities including client feedback, expense submission, and quality rating.

**Owner**: Operations Team + Finance

**Key Actions**:
- Collect client feedback (Google review, testimonial)
- Submit all expenses and bills to Finance
- Update Ops Data Manager
- Complete unpacking and equipment reset
- Fill Zero Fault Delivery (ZFD) rating

**Exit Criteria** (ALL must be YES):
- [ ] Finance submission done
- [ ] Ops data updated
- [ ] ZFD filled and approved

**Cannot Progress If**:
- ZFD rating not filled
- ZFD rating ≤3 without mandatory comments
- Finance submission incomplete

---

### Stage 5: Done

**Purpose**: Archive completed program with locked data for reporting and audits.

**Owner**: System (auto-closed)

**Characteristics**:
- Card is locked for edits (read-only)
- All data available for reporting
- Audit trail preserved
- Can be reopened only by Admin with justification

---

## Field Specifications

### Required Fields by Stage

#### Stage 1 (Mandatory)
- Program Name
- Program Type
- Program Date(s)
- Location/Venue
- Min-Max Pax
- Sales POC
- Client POC (all subfields)
- Company Name
- Activity Type
- Activities Committed
- Objectives
- **Agenda Document** (attachment)
- Delivery Budget
- Ops SPOC
- Finance Approval
- Handover Acceptance

#### Stage 2 (Mandatory)
- Facilitators Blocked (at least 1)
- Logistics List (auto-generated or uploaded)
- All Resources Blocked = YES
- Logistics List Locked = YES
- Prep Complete = YES

#### Stage 3 (Mandatory)
- Packing Check Done
- Packing Owner
- Setup On Time (Yes/No)
- Activities Executed (multi-select)
- Actual Participant Count
- **Trip Expense Sheet** (attachment)

#### Stage 4 (Mandatory)
- Ops Data Manager Updated = YES
- Expenses & Bills Submitted = YES
- ZFD Rating (1-5)
- ZFD Comments (mandatory if rating ≤3)

---

## Validation Rules

### Field-Level Validations

```javascript
// Program Dates
programDates: {
  validation: dates.every(date => date >= today),
  error: "Program dates cannot be in the past"
}

// Pax Range
minPax: {
  validation: minPax > 0 && minPax <= maxPax,
  error: "Min pax must be positive and not exceed max pax"
}

// Email Format
clientPOC.email: {
  validation: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
  error: "Invalid email format"
}

// Phone Format (Indian)
clientPOC.phone: {
  validation: /^[6-9]\d{9}$/.test(phone),
  error: "Invalid Indian phone number (10 digits starting with 6-9)"
}

// Budget
deliveryBudget: {
  validation: budget > 0,
  error: "Budget must be a positive number"
}

// ZFD Rating
zfdRating: {
  validation: rating >= 1 && rating <= 5,
  error: "Rating must be between 1 and 5"
}

// ZFD Comments (conditional)
zfdComments: {
  validation: zfdRating > 3 || (zfdComments && zfdComments.length > 10),
  error: "Comments mandatory for ratings ≤3 (minimum 10 characters)"
}

// File Size Limits
attachments: {
  validation: fileSize <= 10 * 1024 * 1024, // 10MB
  error: "File size must not exceed 10MB"
}

// Allowed File Types
documents: {
  validation: ["pdf", "doc", "docx", "xls", "xlsx"].includes(fileExtension),
  error: "Only PDF, DOC, DOCX, XLS, XLSX files allowed"
}

media: {
  validation: ["jpg", "jpeg", "png", "mp4", "mov"].includes(fileExtension),
  error: "Only JPG, PNG, MP4, MOV files allowed"
}
```

### Stage Transition Validations

```javascript
// Stage 1 → Stage 2
canProgressFromStage1: () => {
  return (
    stage1.opsSPOC && 
    stage1.financeApprovalReceived === true &&
    stage1.handoverAcceptedByOps === true &&
    stage1.agendaDocument &&
    allMandatoryFieldsFilled(stage1)
  );
}

// Stage 2 → Stage 3
canProgressFromStage2: () => {
  return (
    stage2.allResourcesBlocked === true &&
    stage2.logisticsListLocked === true &&
    stage2.prepComplete === true &&
    stage2.facilitatorsBlocked.length > 0
  );
}

// Stage 3 → Stage 4 (Auto-advance)
canProgressFromStage3: () => {
  return (
    stage3.tripExpenseSheet &&
    stage3.packingCheckDone === true
  );
}

// Stage 4 → Stage 5
canProgressFromStage4: () => {
  return (
    stage4.expensesBillsSubmitted === true &&
    stage4.opsDataManagerUpdated === true &&
    stage4.zfdRating &&
    (stage4.zfdRating > 3 || (stage4.zfdComments && stage4.zfdComments.length >= 10))
  );
}
```

---

## Automation Logic

### Auto-Generated Fields

```javascript
// Program ID Generation
generateProgramId: () => {
  const year = new Date().getFullYear();
  const sequence = getNextSequenceNumber(year);
  return `TRB-${year}-${String(sequence).padStart(3, '0')}`;
  // Example: TRB-2024-001, TRB-2024-002, etc.
}

// Logistics List Auto-Generation
generateLogisticsList: (programData) => {
  const items = [];
  
  // Based on program type
  if (programData.programType === "E2E") {
    items.push("Tents (quantity based on pax)");
    items.push("Sleeping bags");
    items.push("Camping equipment");
  }
  
  // Based on activities
  programData.activitiesCommitted.forEach(activity => {
    items.push(...getActivityEquipment(activity));
  });
  
  // Common items
  items.push("First aid kit");
  items.push("Water bottles");
  items.push("Name tags");
  
  return generatePDFChecklist(items);
}
```

### Automated Notifications

```javascript
// Email Triggers
notifications: {
  // Stage 1
  onHandoverCreated: {
    to: ["ops.head@trebound.com", assignedOpsSPOC],
    subject: "New Program Handover: {programName}",
    trigger: "on_stage_1_creation"
  },
  
  onFinanceApprovalNeeded: {
    to: ["finance@trebound.com"],
    subject: "Finance Approval Required: {programId}",
    trigger: "on_stage_1_submission"
  },
  
  onHandoverRejected: {
    to: [salesPOC],
    subject: "Program Handover Rejected: {programId}",
    trigger: "on_finance_rejection_or_ops_rejection"
  },
  
  // Stage 2
  onResourceBlockingRequired: {
    to: [opsSPOC],
    subject: "Resource Blocking Required: {programName}",
    trigger: "on_stage_2_entry"
  },
  
  onPrepComplete: {
    to: [salesPOC, opsSPOC],
    subject: "Program Prep Complete: {programName}",
    trigger: "on_stage_2_exit"
  },
  
  // Stage 3
  onDeliveryDay: {
    to: [facilitatorsBlocked, opsSPOC],
    subject: "Delivery Day Reminder: {programName}",
    trigger: "1_day_before_program_date",
    time: "08:00 AM"
  },
  
  onExpenseSheetOverdue: {
    to: [facilitatorsBlocked],
    subject: "Expense Sheet Submission Overdue: {programId}",
    trigger: "24_hours_after_delivery_without_submission"
  },
  
  // Stage 4
  onPostDeliveryTasks: {
    to: [opsSPOC],
    subject: "Post-Delivery Tasks Pending: {programName}",
    trigger: "on_stage_4_entry"
  },
  
  onLowZFDRating: {
    to: ["ops.head@trebound.com", "quality@trebound.com"],
    subject: "Low ZFD Rating Alert: {programId} - Rating: {zfdRating}",
    trigger: "on_zfd_rating_≤3"
  }
}

// SMS Triggers (for critical alerts)
smsNotifications: {
  onDeliveryDayMorning: {
    to: [facilitatorsBlocked[0]], // Lead facilitator
    message: "Reminder: {programName} delivery today at {location}. Good luck!",
    trigger: "delivery_day_7am"
  },
  
  onMedicalIssue: {
    to: ["ops.head.phone", opsSPOC.phone],
    message: "ALERT: Medical issue reported for {programId}. Check dashboard immediately.",
    trigger: "on_medical_issues_true"
  }
}
```

### Auto-Progression Rules

```javascript
// Stage 3 → Stage 4 Auto-Advancement
if (stage3.tripExpenseSheet && stage3.packingCheckDone) {
  setTimeout(() => {
    moveToStage4();
  }, 2 * 60 * 60 * 1000); // 2 hours after completion
}

// Stage 5 Auto-Lock
if (currentStage === 5) {
  card.locked = true;
  card.editableBy = ["Admin"];
}
```

---

## User Roles & Permissions

### Role Matrix

| Action | Sales | Ops | Finance | Admin |
|--------|-------|-----|---------|-------|
| Create Program Card | ✓ | ✗ | ✗ | ✓ |
| Edit Stage 1 | ✓ | ✗ | ✗ | ✓ |
| Approve Finance (Stage 1) | ✗ | ✗ | ✓ | ✓ |
| Accept Handover (Stage 1) | ✗ | ✓ | ✗ | ✓ |
| Edit Stage 2 | ✗ | ✓ | ✗ | ✓ |
| Edit Stage 3 | ✗ | ✓ | ✗ | ✓ |
| Edit Stage 4 | ✗ | ✓ | ✗ | ✓ |
| View All Cards | ✓ | ✓ | ✓ | ✓ |
| Delete Card | ✗ | ✗ | ✗ | ✓ |
| Reopen Stage 5 Card | ✗ | ✗ | ✗ | ✓ |
| Export Reports | ✓ | ✓ | ✓ | ✓ |
| Manage Users | ✗ | ✗ | ✗ | ✓ |

### Permission Logic

```javascript
canEditCard: (user, card) => {
  // Admin can edit anything
  if (user.role === "Admin") return true;
  
  // Stage 5 cards are locked
  if (card.currentStage === 5) return false;
  
  // Stage-specific permissions
  switch(card.currentStage) {
    case 1:
      return user.role === "Sales" || 
             (user.role === "Finance" && action === "approve") ||
             (user.role === "Ops" && action === "accept");
    case 2:
    case 3:
    case 4:
      return user.role === "Ops";
    default:
      return false;
  }
}
```

---

## Reporting & Analytics

### Key Metrics Dashboard

```javascript
// Overview Metrics
metrics: {
  totalActivePrograms: count(cards.filter(c => c.currentStage < 5)),
  programsByStage: groupBy(cards, "currentStage"),
  avgCycleTime: calculateAvgCycleTime(cards),
  avgStageTime: calculateAvgStageTime(cards, stageNumber),
  
  // Quality Metrics
  avgZFDRating: average(cards.map(c => c.stage4.zfdRating)),
  lowRatingCount: count(cards.filter(c => c.stage4.zfdRating <= 3)),
  
  // Financial Metrics
  totalRevenue: sum(cards.map(c => c.stage1.deliveryBudget)),
  revenueByProgramType: groupAndSum(cards, "stage1.programType", "stage1.deliveryBudget"),
  
  // Operational Metrics
  onTimeSetupRate: percentage(cards.filter(c => c.stage3.setupOnTime)),
  medicalIncidentRate: percentage(cards.filter(c => c.stage3.medicalIssues)),
  avgParticipantCount: average(cards.map(c => c.stage3.actualParticipantCount))
}
```

### Pre-Built Reports

1. **Pipeline Status Report**
   - Cards in each stage
   - Aging analysis (days in current stage)
   - Bottleneck identification

2. **Program Delivery Report**
   - Programs delivered in date range
   - Facilitator performance
   - Activity execution rate

3. **Financial Report**
   - Revenue by program type
   - Budget vs actual analysis
   - Outstanding expense submissions

4. **Quality Report**
   - ZFD ratings distribution
   - Low rating analysis with comments
   - Client feedback summary

5. **Resource Utilization Report**
   - Facilitator workload
   - Equipment usage tracking
   - Transport scheduling

---

## Implementation Roadmap

### Phase 1: Core Workflow (Weeks 1-4)
- [ ] Database schema setup
- [ ] User authentication
- [ ] Stage 1 & 2 implementation
- [ ] Basic card view and editing

### Phase 2: Execution & Closure (Weeks 5-6)
- [ ] Stage 3 & 4 implementation
- [ ] File upload functionality
- [ ] Mobile-responsive delivery checklist

### Phase 3: Automation & Notifications (Weeks 7-8)
- [ ] Email notification system
- [ ] SMS alerts for critical events
- [ ] Auto-progression logic
- [ ] Validation rule engine

### Phase 4: Reporting & Analytics (Weeks 9-10)
- [ ] Dashboard with key metrics
- [ ] Pre-built report templates
- [ ] Export functionality (Excel, PDF)
- [ ] Data visualization

### Phase 5: Polish & Testing (Weeks 11-12)
- [ ] User acceptance testing
- [ ] Performance optimization
- [ ] Security audit
- [ ] Documentation and training

---

## Appendices

### A. Sample Program IDs
- TRB-2024-001
- TRB-2024-002
- TRB-2024-156

### B. Program Types Explained
- **E2E (End-to-End)**: Multi-day programs with accommodation
- **Day**: Single-day programs, no accommodation
- **Virtual**: Online/hybrid programs
- **OBL (Outbound Learning)**: Outdoor adventure-based learning

### C. Activity Types
- **OTS (Off The Shelf)**: Pre-designed standard activities
- **OBL (Outbound Learning)**: Custom outdoor activities
- **Custom**: Fully customized activities per client needs

### D. ZFD (Zero Fault Delivery) Rating Scale
- **5**: Exceptional delivery, exceeded expectations
- **4**: Excellent delivery, met all expectations
- **3**: Good delivery, minor issues resolved
- **2**: Fair delivery, notable issues
- **1**: Poor delivery, significant problems

---

## Maintenance & Support

### Version Control
- Document Version: 1.0
- Last Updated: January 2026
- Next Review: Quarterly

### Contact
- Technical Support: tech@trebound.com
- Process Questions: ops@trebound.com
- Admin Access Requests: admin@trebound.com

---

*End of Documentation*

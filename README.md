# EcoMemories --- Development & Architecture Guide

> A budget-conscious IoT photobooth system where users deposit
> recyclable/trash items into an automated collection device. Every **5
> valid deposits earns 1 photobooth credit**. The user can then take a
> photo and receive a thermal-printed receipt/ticket containing their
> reward information and a QR code linking to the digital photo.

---

## 1. Project Overview

### 1.1 Concept

EcoMemories combines:

- A web-based photobooth
- An automated trash/recycling collection device
- A reward/credit system
- A thermal printer
- An optional cloud backend
- Realtime device-to-web communication
- Environmental statistics

The system should be developed incrementally so that hardware cost does
not block software development.

### 1.2 Core Rule

The initial reward rule is:

``` text
5 valid deposits = 1 photo credit
1 photo credit = 1 photobooth session
```

The rule should be implemented as backend business logic rather than
inside the Arduino/microcontroller.

### 1.3 Primary Goals

1. Build a working photobooth application.
2. Build a reliable deposit/reward system.
3. Connect physical hardware to the application.
4. Print a thermal receipt/ticket after a successful photo session.
5. Track environmental statistics.
6. Keep the architecture replaceable and extensible.
7. Minimize initial hardware and hosting costs.
8. Support gradual migration from prototype hardware to a standalone
    IoT device.

---

## 2. Design Principles

### 2.1 Software First, Hardware Later

Do not make the physical trashcan a prerequisite for development.

Development should begin with:

``` text
React
  ↓
Laravel
  ↓
PostgreSQL
```

A simulated deposit button should represent the physical device during
early development.

Later:

``` text
Arduino → Laptop → Laravel
```

Finally:

``` text
ESP32 → Wi-Fi → Laravel
```

#### Rationale (Software First, Hardware Later)

This separates software development from hardware availability and
reduces financial risk.

---

### 2.2 Backend Owns Business Logic

The microcontroller should not decide:

``` text
5 deposits = 1 reward
```

Instead:

``` text
Device
  ↓
"Deposit detected"
  ↓
Laravel
  ↓
Validate event
  ↓
Record deposit
  ↓
Evaluate reward rules
  ↓
Create credit
```

#### Rationale (Backend Owns Business Logic)

Business rules change more frequently than hardware firmware.

Keeping reward logic in Laravel makes it:

- Testable
- Configurable
- Easier to change
- Easier to audit
- Independent of hardware

---

### 2.3 Hardware Is a Device Client

The backend should not care whether an event comes from:

- A simulator
- Arduino
- ESP32
- Raspberry Pi
- Another microcontroller

All devices should communicate using the same logical event structure.

Example:

``` json
{
  "device_id": "TRASH-001",
  "event": "deposit",
  "weight": 18.4
}
```

#### Rationale (Hardware Is a Device Client)

This allows the hardware to be replaced without redesigning the backend.

---

### 2.4 Cloud Is an Infrastructure Layer

Supabase should not automatically become the application's
business-logic layer.

Recommended responsibility:

``` text
React
  ↓
Laravel
  ↓
Supabase PostgreSQL
  ↓
Supabase Storage
```

Laravel remains the application brain.

Supabase provides managed infrastructure.

---

## 3. Final Technology Stack

  Layer                  Technology                 Purpose
  ---------------------- -------------------------- ----------------------------------------
  Frontend               React                      Photobooth interface
  Frontend Language      TypeScript                 Type-safe frontend development
  Build Tool             Vite                       Frontend development/build
  Styling                Tailwind CSS               UI styling
  Backend                Laravel                    API and business logic
  Backend Language       PHP                        Laravel runtime
  ORM                    Eloquent                   Database access
  Authentication         Laravel Sanctum            User/device authentication
  Database               PostgreSQL                 Persistent application data
  Cloud Database         Supabase PostgreSQL        Optional managed PostgreSQL
  Storage                Supabase Storage           Photo/object storage
  Realtime               Laravel Reverb             Realtime frontend updates
  Cache                  Redis                      Temporary state/cache
  Queue                  Laravel Queue              Background jobs
  Hardware Prototype     Arduino                    Initial physical prototype
  Future Hardware        ESP32                      Standalone Wi-Fi device
  Sensors                IR sensor                  Object detection
  Weight Detection       Load Cell                  Weight measurement
  Load Cell Interface    HX711                      Load-cell amplifier/ADC
  Hardware Connection    USB Serial                 Arduino-to-laptop prototype
  Device Communication   HTTP                       Initial device API
  Future IoT Protocol    MQTT                       Optional advanced device communication
  Camera                 Browser MediaDevices API   Camera access
  Image Processing       Canvas API                 Capture/basic processing
  Printer                USB Thermal Printer        Physical receipt/ticket
  Print Bridge           Python/Node.js             Local printer communication
  Containers             Docker                     Reproducible development/deployment
  CI/CD                  GitHub Actions             Automated testing/deployment

---

## 4. High-Level Architecture

### 4.1 Target Architecture

``` text
                         ECOMEMORIES
                              │
              ┌───────────────┴────────────────┐
              │                                │
              ▼                                ▼
       ┌──────────────┐                 ┌──────────────┐
       │ React        │                 │ Admin        │
       │ Photobooth   │                 │ Dashboard    │
       └──────┬───────┘                 └──────┬───────┘
              │                                │
              └──────────────┬─────────────────┘
                             │
                        HTTP / Realtime
                             │
                             ▼
                    ┌──────────────────┐
                    │ Laravel          │
                    │                  │
                    │ API              │
                    │ Business Logic   │
                    │ Reward Engine    │
                    │ Device API       │
                    │ Auth             │
                    │ Reverb           │
                    └──────┬──────┬────┘
                           │      │
                    ┌──────┘      └───────┐
                    ▼                      ▼
             ┌──────────────┐      ┌──────────────┐
             │ PostgreSQL   │      │ Redis        │
             │              │      │              │
             │ App Data     │      │ Cache/Queue  │
             └──────┬───────┘      └──────────────┘
                    │
                    ▼
             ┌──────────────┐
             │ Supabase     │
             │ Storage      │
             │              │
             │ Photos       │
             └──────────────┘
                    ▲
                    │
               Device Events
                    │
             ┌──────┴─────────┐
             │                │
             ▼                ▼
       Arduino + Laptop      ESP32
       Development           Production
```

---

## 5. Physical Architecture

The physical installation should be separated into two major systems.

### 5.1 Recycling Device

Responsibilities:

- Detect deposited objects
- Measure weight
- Determine sensor-level validity
- Send device events
- Provide local feedback through LEDs/buzzer
- Report device health

Example:

``` text
Trash
  ↓
IR Sensor
  ↓
Load Cell
  ↓
HX711
  ↓
Microcontroller
  ↓
Device Event
  ↓
Laravel
```

### 5.2 Photobooth Device

Responsibilities:

- Run React photobooth
- Access camera
- Display user session
- Display deposit progress
- Capture photo
- Preview photo
- Trigger print job
- Show QR code/photo result

Example:

``` text
Laptop
├── Browser
│   └── React Photobooth
│
└── Local Print Service
    └── Thermal Printer
```

#### Rationale (Photobooth Device)

Keeping recycling hardware and photobooth/printing hardware separate
makes debugging and replacement easier.

---

## 6. Hardware Strategy

### 6.1 Stage A --- No Hardware

Use a simulator:

``` text
[ SIMULATE DEPOSIT ]
```

Each click creates a fake deposit.

Example:

``` text
1 / 5
2 / 5
3 / 5
4 / 5
5 / 5
```

Then:

``` text
PHOTO CREDIT +1
```

#### Goal (Stage A --- No Hardware)

Prove that the complete software workflow works before purchasing
hardware.

---

### 6.2 Stage B --- Arduino + Laptop

Use an existing Arduino if available.

``` text
Arduino
   │
   │ USB Serial
   ▼
Laptop
   │
   │ HTTP
   ▼
Laravel
```

A small Python bridge can listen for serial events.

Example:

``` text
Arduino sends:

DEPOSIT
```

Python receives:

``` text
DEPOSIT
```

Then calls:

``` http
POST /api/devices/events
```

#### Goal (Stage B --- Arduino + Laptop)

Test real hardware communication without needing a Wi-Fi-capable
microcontroller.

---

### 6.3 Stage C --- IR Sensor

Replace the development button with an IR sensor.

``` text
Object
  ↓
IR Sensor
  ↓
Microcontroller
  ↓
DEPOSIT
```

#### Limitation (Stage C --- IR Sensor)

An IR sensor alone may be vulnerable to false positives or simple abuse.

It should be considered an initial detection mechanism rather than final
validation.

---

### 6.4 Stage D --- Weight Validation

Add:

- Load cell
- HX711

Logic:

``` text
Object detected
      +
Weight detected
      ↓
Valid deposit
```

#### Goal (Stage D --- Weight Validation)

Improve deposit validation and reduce simple false positives.

---

### 6.5 Stage E --- ESP32

Once budget permits:

``` text
ESP32
├── IR Sensor
├── Load Cell
├── HX711
├── LED
├── Buzzer
└── Wi-Fi
      │
      ▼
   Laravel
```

The laptop is no longer required for the recycling device.

#### Rationale (Stage E --- ESP32)

ESP32 provides Wi-Fi and enough GPIO/peripheral support for the expected
prototype.

---

## 7. Photobooth Flow

The intended user experience:

``` text
WELCOME
   ↓
CREATE SESSION
   ↓
DEPOSIT TRASH
   ↓
5 VALID DEPOSITS
   ↓
PHOTO CREDIT EARNED
   ↓
OPEN CAMERA
   ↓
COUNTDOWN
   ↓
CAPTURE
   ↓
PREVIEW
   ↓
RETAKE or CONFIRM
   ↓
SAVE PHOTO
   ↓
GENERATE PRINT JOB
   ↓
THERMAL RECEIPT
   ↓
DISPLAY DIGITAL PHOTO / QR
```

---

## 8. Session Design

A user does not need a permanent account for the MVP.

Use a temporary session.

Example:

``` text
Session ID:
ABC123
```

The session contains:

``` text
session
├── deposits
├── rewards
├── credits
└── photo sessions
```

Example:

``` text
ABC123

Deposits: 5
Credits: 1
Photos: 0
```

After taking the photo:

``` text
ABC123

Deposits: 5
Credits: 0
Photos: 1
```

### Rationale (Session Design)

A temporary session keeps the initial system simple while preserving a
path toward accounts, QR codes, RFID, NFC, or student IDs later.

---

## 9. Database Design

Initial entities:

``` text
users
devices
sessions
deposits
rewards
photo_sessions
photos
transactions
```

### 9.1 users

``` text
id
name
identifier
created_at
updated_at
```

Optional for MVP.

---

### 9.2 devices

``` text
id
name
device_code
device_key
type
status
last_seen_at
created_at
updated_at
```

Examples:

``` text
TRASH-001
TRASH-002
```

---

### 9.3 sessions

``` text
id
session_code
user_id nullable
status
created_at
expires_at
updated_at
```

---

### 9.4 deposits

``` text
id
session_id
device_id
weight nullable
type nullable
status
event_id
created_at
```

Possible statuses:

``` text
pending
valid
invalid
rejected
```

---

### 9.5 rewards

``` text
id
session_id
type
amount
status
created_at
```

Example:

``` text
type: photo_credit
amount: 1
status: available
```

---

### 9.6 photo_sessions

``` text
id
session_id
reward_id
status
photo_id nullable
created_at
completed_at nullable
```

---

### 9.7 photos

``` text
id
photo_session_id
storage_path
public_url nullable
created_at
```

The database stores metadata, not the actual image binary.

---

### 9.8 transactions

Use this for an audit trail.

``` text
id
session_id
type
reference_id
metadata
created_at
```

Examples:

``` text
deposit_recorded
reward_earned
credit_consumed
photo_created
print_requested
```

---

## 10. Reward Engine

The reward system should be implemented as a service.

Example conceptual flow:

``` text
RecordDeposit
      ↓
Count valid deposits
      ↓
Determine available rewards
      ↓
Create reward
      ↓
Create photo credit
```

The reward rule should be configurable.

Initial configuration:

``` text
required_deposits = 5
reward_type = photo_credit
reward_amount = 1
```

Future possibilities:

``` text
10 deposits → 2 credits
20 deposits → special frame
50 deposits → premium reward
```

### Important

Do not use only:

``` text
session.deposit_count = 5
```

Store each deposit individually.

### Rationale (Reward Engine)

Individual deposit records provide:

- Auditability
- Debugging
- Environmental statistics
- Fraud detection
- Device diagnostics
- Future analytics

---

## 11. Device Event API

The device should communicate through an event-oriented API.

Example:

``` http
POST /api/devices/events
```

Payload:

``` json
{
  "device_id": "TRASH-001",
  "event": "deposit",
  "weight": 18.4,
  "event_id": "evt-000001"
}
```

Laravel should:

1. Authenticate device.
2. Validate payload.
3. Check duplicate event IDs.
4. Validate the session.
5. Record deposit.
6. Run reward logic.
7. Broadcast the result.
8. Return the updated state.

Example response:

``` json
{
  "success": true,
  "deposit": {
    "id": 1001,
    "status": "valid"
  },
  "session": {
    "deposits": 4,
    "required": 5,
    "credits": 0
  }
}
```

---

## 12. Device Authentication

Devices should eventually have credentials.

Example:

``` text
TRASH-001
Device Key
Secret Key
```

The device sends its credential with requests.

Laravel validates:

``` text
Device exists?
    ↓
Credential valid?
    ↓
Device active?
    ↓
Accept event
```

### Rationale (Device Authentication)

Without device authentication, anyone who knows the API endpoint could
potentially generate fake deposits.

---

## 13. Idempotency

IoT devices may retry requests.

For example:

``` text
Arduino
  ↓
DEPOSIT
  ↓
Laravel
  ↓
Network failure
  ↓
Arduino retries
```

Without protection:

``` text
1 physical deposit
      ↓
2 database deposits
```

Use a unique `event_id`.

Example:

``` text
evt-000123
```

Laravel should reject duplicate event IDs.

### Rationale (Idempotency)

This prevents network retries from creating duplicate rewards.

---

## 14. Realtime Communication

Use Laravel Reverb after the basic system works.

Flow:

``` text
Device
  ↓
Laravel
  ↓
DepositRecorded event
  ↓
Reverb
  ↓
React
```

React updates:

``` text
Deposits: 4 / 5
```

to:

``` text
Deposits: 5 / 5
🎉 PHOTO CREDIT EARNED
```

### Rationale (Realtime Communication)

Realtime communication creates a better physical-machine experience
without polling the API repeatedly.

---

## 15. Redis

Redis should be introduced after the basic MVP.

Potential uses:

- Temporary session state
- Device online status
- Rate limiting
- Caching
- Queue support
- Realtime counters

Do not introduce Redis merely because it is available.

Start with:

``` text
Laravel + PostgreSQL
```

and add Redis when the application has a real need for it.

---

## 16. Supabase Strategy

Supabase is optional.

Recommended use:

``` text
Laravel
   ↓
Supabase PostgreSQL
```

and:

``` text
Laravel
   ↓
Supabase Storage
```

### Supabase PostgreSQL

Use it as managed PostgreSQL infrastructure if desired.

### Supabase Storage

Use it for:

- Photos
- Generated photo assets
- Potential future media

Example:

``` text
photos/
  2026/
    08/
      ECO-000001.jpg
      ECO-000002.jpg
```

### Important

Laravel should remain responsible for business logic.

Avoid having the React application independently perform all business
operations against Supabase.

Recommended:

``` text
React
  ↓
Laravel
  ↓
Supabase
```

rather than:

``` text
React
  ├── Laravel
  └── Supabase
```

for the same business workflow.

---

## 17. Offline/Connectivity Strategy

The system is intended for a physical installation, so network failure
must eventually be considered.

### Initial prototype

Internet required.

``` text
Device
 ↓
Laptop
 ↓
Laravel
```

### Future architecture

The photobooth/laptop can maintain a local queue:

``` text
Physical Event
      ↓
Local Event Queue
      ↓
Internet Available?
   /          \
 YES           NO
  ↓             ↓
Sync         Store locally
```

When connectivity returns:

``` text
Local Events
    ↓
Synchronization
    ↓
Cloud Backend
```

### Rationale (Offline/Connectivity Strategy)

A public installation should not completely stop functioning because of
a temporary internet outage.

---

## 18. Thermal Printer Architecture

The printer is a **thermal printer**, not a traditional photo printer.

The recommended architecture:

``` text
React
  ↓
Laravel
  ↓
Print Job
  ↓
Local Print Service
  ↓
USB
  ↓
Thermal Printer
```

Do not make the browser directly responsible for printer management.

---

## 19. Thermal Print Design

The thermal printer should print a receipt/ticket rather than attempt to
reproduce a high-quality photograph.

Example:

``` text
================================
        ECOMEMORIES
================================

       RECYCLING REWARD

Items Collected:       5
Photo Credits Earned:  1

       PHOTO #00124

Thank you for helping
reduce waste!

---

          [ QR CODE ]

Scan to view/download
your digital photo.

================================
```

The QR code can point to a photo page.

Example concept:

``` text
/photo/ECO-00124
```

The actual URL structure should be decided during implementation.

---

## 20. Why Thermal Printing Is Useful

The thermal receipt can contain:

- Session/reference number
- Number of items collected
- Estimated weight
- Reward earned
- QR code
- Digital photo reference
- Environmental message
- Timestamp

This makes the physical printout useful without requiring an expensive
photo printer.

---

## 21. Local Print Service

The print service should run on the photobooth laptop.

Possible implementation:

``` text
Python + pyserial/USB printer libraries
```

or:

``` text
Node.js
```

Its responsibilities:

``` text
Receive print job
      ↓
Validate job
      ↓
Generate receipt
      ↓
Send commands to printer
      ↓
Report result
```

Laravel should not need to understand low-level printer commands.

---

## 22. Camera Architecture

Use the browser camera API.

``` text
React
  ↓
navigator.mediaDevices.getUserMedia()
  ↓
Video Preview
  ↓
Capture
  ↓
Canvas
  ↓
Image
```

Initial features:

- Camera preview
- Countdown
- Capture
- Retake
- Confirm

Do not start with:

- AI filters
- Complex image effects
- Face detection
- Video
- GIFs

Build the reliable basic flow first.

---

## 23. QR Code Strategy

QR can eventually be used for:

### Session identification

``` text
QR
 ↓
Session
```

### Photo retrieval

``` text
QR
 ↓
Digital Photo Page
```

### Future user identity

``` text
QR / RFID / NFC
 ↓
User
```

Start with photo retrieval because it directly supports the thermal
receipt.

---

## 24. Admin Dashboard

The admin dashboard should eventually show:

``` text
Total Deposits
Total Weight
Total Credits
Total Photos
Active Sessions
Online Devices
Offline Devices
Print Jobs
```

Example:

``` text
ECOMEMORIES ADMIN

Deposits                 12,450
Collected Weight          186.2 KG
Credits Issued             2,490
Photos Taken               2,301

DEVICES

TRASH-001                 ONLINE
TRASH-002                 ONLINE
TRASH-003                 OFFLINE
```

---

## 25. Environmental Analytics

Track:

``` text
total_items
total_weight
total_rewards
total_photos
```

Potential future metrics:

``` text
items per day
weight per day
credits per device
photos per device
average deposit weight
device uptime
```

The statistics should be based on actual database records.

---

## 26. Development Phases

### Phase 0 --- Planning

### Goal (Development Phases)

Define the system before writing major code.

### Tasks

- Define requirements
- Define user flow
- Define reward rules
- Define hardware assumptions
- Define database entities
- Define API boundaries
- Create architecture documentation

### Deliverable

``` text
docs/
├── requirements.md
├── architecture.md
└── development-roadmap.md
```

---

### Phase 1 --- Project Foundation

### Goal (Development Phases)

Create the application skeleton.

### Stack

``` text
Laravel
React
TypeScript
Vite
PostgreSQL
```

### Tasks

- Create Git repository
- Create Laravel backend
- Create React frontend
- Configure PostgreSQL
- Configure environment variables
- Establish API communication
- Establish local development workflow

### Deliverable

``` text
React → Laravel → PostgreSQL
```

works successfully.

---

### Phase 2 --- Database & Sessions

### Goal (Development Phases)

Create the foundation for users and photobooth sessions.

### Tasks

- Create migrations
- Create Eloquent models
- Create relationships
- Create session API
- Create session status
- Add basic validation

### Deliverable

A user can start:

``` text
Session ABC123
```

---

### Phase 3 --- Deposit System

### Goal (Development Phases)

Implement deposits without hardware.

### Tasks

- Create deposit endpoint
- Create simulated deposit button
- Record deposit
- Validate deposit
- Display progress

Example:

``` text
[ SIMULATE DEPOSIT ]

1 / 5
2 / 5
3 / 5
4 / 5
5 / 5
```

### Deliverable

The complete deposit workflow works without hardware.

---

### Phase 4 --- Reward Engine

### Goal (Development Phases)

Automatically award photo credits.

### Tasks

- Implement reward service
- Configure deposit threshold
- Create reward records
- Create credit records
- Prevent duplicate rewards
- Add tests

### Deliverable

``` text
5 valid deposits
        ↓
1 photo credit
```

---

### Phase 5 --- Photobooth

### Goal (Development Phases)

Build the actual camera experience.

### Tasks

- Camera permission
- Camera preview
- Countdown
- Capture
- Preview
- Retake
- Confirm
- Photo metadata

### Deliverable

A user with a valid credit can take a photo.

---

### Phase 6 --- Photo Storage

### Goal (Development Phases)

Persist digital photos.

### Tasks

- Configure storage
- Upload image
- Create photo record
- Generate photo reference
- Build photo view page

### Recommended

Use Supabase Storage if Supabase is selected.

### Deliverable

``` text
Photo
 ↓
Storage
 ↓
Database reference
 ↓
Digital photo page
```

---

### Phase 7 --- Thermal Printer

### Goal (Development Phases)

Print a physical reward ticket.

### Tasks

- Create print job model
- Create local print service
- Connect thermal printer
- Generate receipt
- Generate QR code
- Print test receipt
- Add print status

### Deliverable

``` text
Photo confirmed
      ↓
Thermal receipt
      ↓
QR code
      ↓
Digital photo
```

---

### Phase 8 --- Device Simulator

### Goal (Development Phases)

Create a realistic replacement for Arduino.

The simulator should behave like a real device.

Example:

``` text
POST /api/devices/events
```

Payload:

``` json
{
  "device_id": "SIMULATOR-001",
  "event": "deposit",
  "event_id": "evt-123"
}
```

### Deliverable

The backend can be tested independently of physical hardware.

---

### Phase 9 --- Arduino + Laptop

### Goal (Development Phases)

Connect the first physical device.

Architecture:

``` text
Arduino
  ↓ USB
Laptop
  ↓ Python Bridge
Laravel
```

### Tasks

- Arduino firmware
- Serial protocol
- Python serial listener
- HTTP communication
- Device authentication
- Event IDs
- Retry handling
- Logging

### Deliverable

Pressing/detecting a physical Arduino event creates a Laravel deposit.

---

### Phase 10 --- IR Sensor

### Goal (Development Phases)

Replace the physical test button with object detection.

### Tasks

- Connect IR sensor
- Detect object
- Debounce sensor
- Prevent multiple counts
- Send deposit event
- Test false positives

### Deliverable

``` text
Object
 ↓
IR Sensor
 ↓
Arduino
 ↓
Laravel
```

---

### Phase 11 --- Weight Validation

### Goal (Development Phases)

Improve deposit validation.

### Hardware

``` text
Load Cell
+
HX711
```

### Tasks

- Read weight
- Calibrate load cell
- Define minimum weight
- Combine IR + weight events
- Reject invalid deposits
- Record measured weight

### Deliverable

``` text
Object detected
+
Valid weight
↓
Valid deposit
```

---

### Phase 12 --- Realtime

### Goal (Development Phases)

Remove manual refreshing.

### Technology

``` text
Laravel Reverb
```

### Tasks

- Create Laravel events
- Configure broadcasting
- Subscribe React
- Update deposit progress
- Display reward notification
- Display device status

### Deliverable

``` text
Physical deposit
      ↓
Arduino
      ↓
Laravel
      ↓
Reverb
      ↓
React updates instantly
```

---

### Phase 13 --- Redis & Queues

### Goal (Development Phases)

Introduce asynchronous processing where useful.

### Tasks

- Configure Redis
- Configure queues
- Queue photo processing
- Queue print jobs if necessary
- Cache appropriate data
- Add failed-job handling

### Deliverable

Long-running operations do not block the main request unnecessarily.

---

### Phase 14 --- ESP32

### Goal (Development Phases)

Remove the laptop dependency from the recycling device.

Architecture:

``` text
ESP32
  ↓ Wi-Fi
Laravel
```

### Tasks

- ESP32 networking
- Device authentication
- HTTP API
- Retry logic
- Offline event queue
- Heartbeat
- Device status

### Deliverable

The physical trashcan can operate as an independent networked device.

---

### Phase 15 --- Admin Dashboard

### Goal (Development Phases)

Manage and monitor the installation.

### Tasks

- Dashboard
- Device list
- Device status
- Deposit statistics
- Weight statistics
- Reward statistics
- Photo statistics
- Print status
- Session history

---

### Phase 16 --- Physical Trashcan

### Goal (Development Phases)

Build the actual enclosure/mechanism.

### Components may include

``` text
Microcontroller
IR Sensor
Load Cell
HX711
LED
Buzzer
Servo
Chute/gate
Trash container
Power supply
```

### Deliverable

A complete physical recycling station.

---

### Phase 17 --- Hardening

### Goal (Development Phases)

Prepare for real-world use.

### Tasks

- Device authentication
- API rate limiting
- Duplicate event prevention
- Input validation
- Logging
- Error handling
- Offline handling
- Database backups
- Photo retention policy
- Security review
- Printer failure handling
- Sensor failure handling

---

## 27. Failure Scenarios

The system should eventually handle:

### Internet unavailable

``` text
Store event locally
      ↓
Retry later
```

### Laravel unavailable

``` text
Device stores event
      ↓
Retry
```

### Duplicate event

``` text
event_id already exists
      ↓
Ignore duplicate
```

### Printer unavailable

``` text
Photo saved
      ↓
Print job = pending
      ↓
Retry
```

### Sensor malfunction

``` text
Invalid readings
      ↓
Device warning
      ↓
Admin notification
```

---

## 28. Testing Strategy

Testing should happen at multiple levels.

### Unit Tests

Test:

``` text
RewardService
Deposit validation
Credit consumption
Device event validation
```

Example:

``` text
Given 5 valid deposits
When reward evaluation runs
Then 1 photo credit is created
```

### Feature/API Tests

Test:

``` text
POST /api/sessions
POST /api/devices/events
GET /api/sessions/{id}
POST /api/photos
```

### Frontend Tests

Test:

``` text
Session creation
Deposit progress
Credit display
Camera flow
Photo confirmation
```

### Hardware Tests

Test:

``` text
Sensor detection
Serial communication
Network failure
Duplicate events
Weight readings
```

---

## 29. Security Considerations

Important areas:

- Validate every API request.
- Authenticate devices.
- Never expose device secrets in the React application.
- Use environment variables for secrets.
- Rate-limit device endpoints.
- Prevent duplicate event processing.
- Validate uploaded photos.
- Restrict storage access where appropriate.
- Use HTTPS in production.
- Keep Laravel and dependencies updated.
- Do not trust sensor-provided values blindly.

---

## 30. Repository Structure

Recommended starting structure:

``` text
eco-photobooth/
│
├── backend/
│   └── Laravel application
│
├── frontend/
│   └── React application
│
├── device/
│   ├── simulator/
│   └── arduino/
│
├── print-service/
│
├── docs/
│   ├── requirements.md
│   ├── architecture.md
│   ├── database.md
│   ├── api.md
│   ├── hardware.md
│   ├── device-protocol.md
│   ├── photobooth.md
│   ├── development-roadmap.md
│   └── decisions/
│
├── docker/
│
├── .github/
│   └── workflows/
│
├── README.md
└── docker-compose.yml
```

---

## 31. Documentation Strategy

Maintain documentation as the project evolves.

Recommended documents:

### `requirements.md`

What the system must do.

### `architecture.md`

How the components interact.

### `database.md`

Entities, relationships, and important constraints.

### `api.md`

API endpoints and payloads.

### `hardware.md`

Hardware components and wiring information.

### `device-protocol.md`

The communication protocol between hardware and backend.

### `photobooth.md`

Camera and photo workflow.

### `development-roadmap.md`

Current phase and future phases.

### `decisions/`

Architecture Decision Records.

Example:

``` text
001-laravel-react.md
002-device-event-api.md
003-thermal-printer.md
004-supabase-storage.md
```

---

## 32. Architecture Decision Records

For important decisions, document:

``` text
Decision
Context
Options considered
Chosen option
Rationale
Consequences
```

Example:

``` text
Decision:
Use Laravel as the primary backend.

Context:
The project requires an API, business rules,
device communication, authentication, queues,
and realtime events.

Options:
- Laravel
- Node.js
- Supabase-only

Decision:
Laravel

Rationale:
Laravel aligns with the project's learning goals
and centralizes business logic.

Consequences:
The project gains a strong backend boundary but
requires Laravel hosting.
```

---

## 33. Cost-Control Strategy

Do not purchase everything at the beginning.

### Start with

``` text
Laptop
Software
Laravel
React
PostgreSQL
```

### Then

``` text
Existing Arduino
+
Basic sensor
```

### Then

``` text
IR sensor
+
Load cell
+
HX711
```

### Then

``` text
Thermal printer
```

### Later

``` text
ESP32
+
Physical enclosure
+
Servo/mechanism
```

### Principle

> Never purchase hardware to solve a problem that can currently be
> simulated in software.

---

## 34. MVP Definition

The first MVP does NOT require:

- Arduino
- ESP32
- IR sensor
- Load cell
- Redis
- MQTT
- Realtime
- Physical trashcan
- Admin dashboard

The MVP only needs:

``` text
React
   ↓
Laravel
   ↓
PostgreSQL
```

with:

``` text
Create Session
      ↓
Simulate Deposit × 5
      ↓
Earn Credit
      ↓
Open Camera
      ↓
Take Photo
      ↓
Save Photo
      ↓
Display QR / Photo
```

Once this works, the project has a functioning software core.

---

## 35. Recommended Milestones

### Milestone 1

``` text
Laravel + React connected
```

### Milestone 2

``` text
Session + Database
```

### Milestone 3

``` text
5 deposits → 1 credit
```

### Milestone 4

``` text
Camera → Photo
```

### Milestone 5

``` text
Photo → Thermal Receipt
```

### Milestone 6

``` text
Device Simulator → Laravel
```

### Milestone 7

``` text
Arduino → Laptop → Laravel
```

### Milestone 8

``` text
IR Sensor → Arduino
```

### Milestone 9

``` text
IR + Load Cell
```

### Milestone 10

``` text
Realtime + Redis
```

### Milestone 11

``` text
ESP32 → Laravel
```

### Milestone 12

``` text
Complete Physical EcoMemories
```

---

## 36. Final Target Architecture

The final system should look approximately like:

``` text
                         ┌──────────────────────┐
                         │      USER            │
                         └──────────┬───────────┘
                                    │
                           Deposit recyclable
                                    │
                                    ▼
                    ┌───────────────────────────┐
                    │     ECO TRASHCAN          │
                    │                           │
                    │ IR Sensor                 │
                    │ Load Cell                 │
                    │ HX711                     │
                    │ ESP32                     │
                    └────────────┬──────────────┘
                                 │
                              Wi-Fi
                                 │
                                 ▼
                    ┌───────────────────────────┐
                    │         LARAVEL           │
                    │                           │
                    │ Device API                │
                    │ Deposit Validation        │
                    │ Reward Engine              │
                    │ Sessions                   │
                    │ Authentication             │
                    │ Photo Management            │
                    │ Print Jobs                  │
                    └──────┬───────────┬────────┘
                           │           │
                  ┌────────┘           └─────────┐
                  ▼                              ▼
           ┌──────────────┐               ┌──────────────┐
           │ PostgreSQL   │               │    Redis     │
           │              │               │              │
           │ App Data     │               │ Cache/Queue  │
           └──────┬───────┘               └──────────────┘
                  │
                  ▼
           ┌──────────────┐
           │ Supabase     │
           │ Storage      │
           │              │
           │ Photos       │
           └──────────────┘
                  │
                  │
                  ▼
           ┌──────────────┐
           │ React        │
           │ Photobooth   │
           │              │
           │ Camera       │
           │ Preview      │
           │ QR Code      │
           └──────┬───────┘
                  │
                  ▼
           ┌──────────────┐
           │ Print Service│
           └──────┬───────┘
                  │
                 USB
                  │
                  ▼
           ┌──────────────┐
           │   Thermal    │
           │   Printer    │
           └──────────────┘
```

---

## 37. Final Development Philosophy

The project should evolve in this order:

``` text
SIMULATE
   ↓
VALIDATE
   ↓
INTEGRATE
   ↓
AUTOMATE
   ↓
HARDEN
   ↓
DEPLOY
```

Do not start by building the entire physical machine.

Start by proving:

> **"Can the software correctly turn five deposit events into one photo
> credit?"**

Then prove:

> **"Can the user spend that credit to take a photo?"**

Then:

> **"Can the system print a thermal reward ticket?"**

Then:

> **"Can physical hardware generate the deposit events?"**

Finally:

> **"Can the entire system operate reliably as a physical
> installation?"**

That progression keeps the project financially manageable while allowing
the architecture to grow from a simple web application into a complete
IoT system.

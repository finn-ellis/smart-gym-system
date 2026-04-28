# **SIFLY Inc. Smart Gym Management System**

*Software Architecture Design*

*SAD Version 2.0* 

 

Team T05  
23 April 2026   
   
Liepa Lavickyte (manager)  
Finn Ellis  
Samuel Landis  
Ike Osode  
Younes Slaoui  
 

 

 

**CS 460 Software Engineering**

Table of Contents

[**1\. Introduction	3**](#1.-introduction)

[**2\. Design Overview	4**](#2.-design-overview)

[2.1 Design Approach	4](#2.1-design-approach)

[2.2 Design Diagram	4](#2.2-design-diagram)

[**3\. Component Specifications	6**](#3.-component-specifications)

[IoT Gateway	6](#iot-gateway)

[MLLM Handler	7](#mllm-handler)

[Gemini 3.1 Pro	7](#gemini-3.1-pro)

[Environmental Sensor Handler	8](#environmental-sensor-handler)

[Wristband Handler	9](#wristband-handler)

[Data & Analytics Engine	10](#data-&-analytics-engine)

[Report Generation Handler	12](#report-generation-handler)

[Gym Management Portal Handler	13](#gym-management-portal-handler)

[Gym Management Portal App	15](#gym-management-portal-app)

[Data Stores	16](#data-stores)

[**4\. Sample Use Cases	17**](#4.-sample-use-cases)

[Use Case 1: Critical Safety Event Detection	17](#use-case-1:-critical-safety-event-detection)

[Use Case 2: Environmental Monitoring and Hazard Detection	18](#use-case-2:-environmental-monitoring-and-hazard-detection)

[Use Case 3: Biometric Wearable Data Processing	19](#use-case-3:-biometric-wearable-data-processing)

[Use Case 4: Warning Health Event Detection	20](#use-case-4:-warning-health-event-detection)

[Use Case 5: Facility Data Visibility and Archival Logging	21](#use-case-5:-facility-data-visibility-and-archival-logging)

[Use Case 6: Observational Report Generation	22](#use-case-6:-observational-report-generation)

[**5\. Design Constraints	23**](#5.-design-constraints)

[5.1 Technical and Performance Constraints	23](#5.1-technical-and-performance-constraints)

[5.2 Regulatory and Legal Constraints	23](#5.2-regulatory-and-legal-constraints)

[5.3 Operational Constraints	24](#5.3-operational-constraints)

[**6\. Definition of Terms	25**](#6.-definition-of-terms)

[**7\. Conclusion	26**](#7.-conclusion)

[7.1 Demo Plan	26](#7.1-demo-plan)

[Timeline:	27](#timeline:)

[**8\. References	27**](#8.-references)

## 

# 1\. Introduction {#1.-introduction}

The objective of the document is to provide a technical overview of the structural design, behavioral patterns, and data-transformation logic of  the Smart Gym Management System (SGMS) developed by SIFLY Inc. It serves as the bridge between the higher level software requirements and the actual component implementation, ensuring that the system is scalable, secure, and responsive enough to save lives in a high-intensity fitness environment \[1\].

This document is the primary technical blueprint for the development and maintenance of the SGMS. It is designed to provide stakeholders, lead engineers, and developers with a clear understanding of how multimodal data—ranging from video feeds to real-time physiological telemetry—is ingested, processed by Gemini 3.1 Pro, and translated into deterministic safety actions \[2\]. By defining the boundaries between specialized software handlers and the central Data & Analytics Engine, this document ensures that architectural decisions remain consistent as the system is potentially scaled for additional functional zones in the future.

The scope of the SGMS architecture encompasses the entire data lifecycle within a modern fitness facility, beginning with the ingestion of video feeds and hardware signals through the IoT Gateway and specialized device drivers. These video feeds are subjected to visual reasoning and physiological analysis via the MLLM Handler in coordination with cloud-based AI, while the centralized Data & Analytics Engine orchestrates event routing for the ingested telemetry from environmental sensors and biometric wristbands. Real-time intervention is managed through the Gym Management Portal Handler, which facilitates immediate state updates and alert dispatch to on-duty staff. Finally, the architecture enables long-term persistence through robust archival logging and synthesis of observational reports, providing an end-to-end framework for gym safety and optimization.

The SGMS introduces an AI-driven safety net where the architecture is built to solve the "Black Box" problem of modern AI by enforcing a human-in-the-loop verification protocol. The system treats every frame of video and every heartbeat as a potential data point for a safety event. By utilizing a modular, handler-based architecture, the SGMS can simultaneously track occupancy, detect falls, and monitor for cardiac anomalies without cross-component interference. This design ensures that even if one sensor stream fails, the remaining layers of the architectural safety net remain unbroken.

The software architecture of the SGMS is outlined in eight sections. Section 1 introduces the purpose; Section 2 provides a design overview; Section 3 specifies the components; Section 4 outlines the Use cases; Section 5 describes the design constraints; Section 6 defines terms; Section 7 provides a conclusion, followed by Section 8, which lists reference documentation.

# 2\. Design Overview {#2.-design-overview}

The SGMS is designed as a high-speed, multimodal solution that bridges physical gym activities with advanced digital analysis through a centralized architecture. The system operates by ingesting a continuous stream of visual, environmental, and physiological data, transforming these raw inputs into deterministic safety states via the Data & Analytics Engine. This architecture ensures that the vast amount of data generated in the fitness facility is filtered and synthesized into high-priority alerts for trainers and long-term optimization reports for management.

## 2.1 Design Approach {#2.1-design-approach}

The SGMS utilizes a "Sense-Analyze-Respond" loop where physical hardware components such as cameras, environmental IAQ sensors, and biometric wristbands communicate with the central engine through dedicated device drivers. This infrastructure enables the system to transform physical events (such as a member falling or a heart rate threshold being breached) into digital data, which then activates automated safety procedures and reporting.

The architectural design focuses on the three primary objectives established in the Requirements Definition Document:

* **Safety & Reliability:** Utilizing the MLLM Handler for injury detection and the Environmental Sensor Handler for hazard monitoring ensures that the Data & Analytics Engine can identify emergencies and trigger notifications to the Gym Management Portal App for trainer intervention.  
* **Data-Driven Analysis:** Aggregating occupancy and equipment usage data helps facilitate long-term facility optimization. The Report Generation Handler synthesizes this information from the Data Stores to provide management with insights regarding facility traffic patterns and machine utilization.  
* **Personalized Health & Support:** To ensure tailored support, the system has a Wristband Handler that cross-references real-time physiological telemetry with Member Health Profiles. This allows the Data & Analytics Engine to apply personalized safety thresholds and monitor higher-risk individuals more closely without human intervention until a threshold breach occurs.

## 2.2 Design Diagram {#2.2-design-diagram}

The Architecture Design Diagram is a functional organization of components representing data transformations and distinct actions the application must perform.

![][image1]

*Figure 1: SGMS Architecture Design Diagram*

The flow of data in the diagram begins in the yellow-shaded box on the left containing hardware devices, consisting of cameras, environmental sensors, and biometric wristbands. Arrows in the diagram represent flow of communication between components, pointing in the direction of interface usage. Each component that performs continuous, functional behavior is depicted as a procedure with vertical lines. Data Stores are represented in blue throughout the diagram. To maintain clarity in the diagram, various components that use one or more datastores simply point to their own ‘data’ circle. Gemini 3.1 Pro is depicted as a black box external to the system, visually showing its unknown functionality and third-party position. Finally, the Gym State is hosted by the Data & Analytics Engine and is explicitly shown in turquoise since it is treated as a specific object that many components interact with in the system design.

# 3\. Component Specifications {#3.-component-specifications}

This architecture describes a level deeper than the Software Requirements Specification document. It should be used as requirements for implementation, it is not intended to be exact one-to-one implementation instructions. The system largely works in a flow from user input & device input through various data processing components, producing actionable alerts and artifacts.

The Architecture Design Diagram (*Figure 1*) depicts broad system organization. Hardware data is ingested and processed before being passed to the Data & Analytics Engine. The Data & Analytics Engine performs system-critical data logging and alert generation.

| IoT Gateway |  |
| :---- | :---- |
| Software driver for managing connections from environmental sensors and biometric wristbands and making standard interfaces accessible throughout the software. Exposes APIs to interact with these devices. |  |
| **State** |  connectedSensors List of connected SensorIds connectedWristbands List of connected WristbandIds  |
|  |  |
| **Interface** | Functions pollSensor(SensorId) Read from a connected environmental sensor pollWristband(WristbandId) Read from a connected biometric wristband  |
|  |  |
| **Dependencies** | Environmental Sensor Hardware Wristband Hardware |
| **Behavior** | Automatically performs discovery and connection with gym wristbands and sensors. |

| MLLM Handler |  |
| :---- | :---- |
| Reads from camera feed, incrementally performs calls to **Gemini 3.1 Pro** with pictures and videos, and handles parsing LLM responses. When video clips are flagged as alerts, it saves them to the **Video Clips Archive.** Sends responses to the Data & Analytics Engine. |  |
| **State** |  connectedCameras List of connected cameras and associated ZoneIds  |
|  |  |
| **Interface** | No external interface |
|  |  |
| **Dependencies** | Camera Hardware Gemini 3.1 Pro Defined Camera Zone Names? |
|  |  |
| **Behavior** | Connects to cameras, associates them with ZoneIds, and reads from their streams Sends regular camera photos, video clips to the MLLM for analysis Parses MLLM responses and updates the state, fires signals Makes calls to **Data & Analytics Engine** to report analyzed zone usage and detected safety alerts |
|  |  |

| Gemini 3.1 Pro |  |
| :---- | :---- |
| Commercial Off-The-Shelf (COTS) MLLM provided by Google. |  |
| **Interface** | **Web API provided by Google \[5\]**  Documentation: [https://ai.google.dev/gemini-api/docs/models/gemini-3.1-pro-preview](https://ai.google.dev/gemini-api/docs/models/gemini-3.1-pro-preview)  |
|  |  |

| Environmental Sensor Handler |  |
| :---- | :---- |
| Utilizes APIs from IoT Gateway to read from environmental sensors and log the data to the **Data & Analytics Engine**. It is responsible for evaluation of environmental data against safety thresholds and ensures that air quality and climate anomalies are classified and logged before being sent to staff through the **Data & Analytics Engine.** |  |
| **State** |  **zoneThresholds** Map\<ZoneId, ThresholdConfig\>. Contains numerical limits for Air quality for each functional gym zone currentReadings Map\<SensorId, LatestTelemetry\>. Receives most recent data packets from the IoT Gateway for real-time comparison zoneStatus Map\<ZoneId, StatusLevel\> tracking whether a zone is currently in a \[Normal\], \[Warning\], or \[Critical\] state  |
|  |  |
| **Interface** |  No external interface |
|  |  |
| **Dependencies** | **IoT Gateway**, for sensor interface. **Data & Analytics Engine**, for routing high-priority alerts to the staff. |
|  |  |
| **Behavior** | Performs regular readings from environmental sensors and logs zone data Compares to environment and air quality safety thresholds to detect alerts and pass them to the **Data & Analytics Engine** |
|  |  |

| Wristband Handler |  |
| :---- | :---- |
| Utilizes APIs from IoT Gateway to read from biometric wristbands and log the data to the **Data & Analytics Engine**. Also reads from the **Member Health Profiles** Data Store to perform personalized monitoring against a member’s health profile. |  |
| **State** |  activeSessions Map\<WristbandId, MemberId\> memberThresholds Map\<MemberId, CustomizedHealthThresholds\>  |
|  |  |
| **Interface** |  pairWristband(WristbandId, MemberId) Mark a wristband as paired with a specified member. Mark it in activeSessions and start polling against member’s specified custom thresholds. unpairWristband(WristbandId) Unmark / remove a wristband pairing from a member.  |
|  |  |
| **Dependencies** | **IoT Gateway** for reading from wristbands **Data & Analytics Engine** to routing biometric data and alerts **Member Health Profiles** for comparing against custom member thresholds |
|  |  |
| **Behavior** | Polls member wristbands regularly based on active sessions and detects alerts based on default or custom member health thresholds. Sends biometric data and detected alerts to the **Data & Analytics Engine** |
|  |  |

| Data & Analytics Engine |  |
| :---- | :---- |
| Synthesizes data from the various handlers into the **Gym State**, **Data Stores**, and **Report Generation Handler**. Responsible for most data processing and mutation in the system |  |
| **State** |  GymState Current, transient, externally read-only state of the gym including: Air Quality Total and by-zone occupancy counts Action-required Alerts  |
|  |  |
| **Interface** |  onSensorProcess(EnvironmentalReading, AlertSeverity) Receives processed data from the **Environmental Sensor Handler**: logs the data and produces an alert if marked onBiometricAlert(BiometricReading, AlertSeverity) Called on wristband biometric alerts. Receives processed data from the **Wristband Handler**: produces an alert and logs it onVideoAlert(AlertSeverity, VideoClipId) Receives flagged video alerts from the **MLLM Handler**: produces a packaged alert and logs it onOccupancyCounted(OccupancyCountsByZone) Receives occupancy counts from the **MLLM Handler** and logs it to the Gym State. dismissAlert(AlertId) Dismisses an alert from the current Gym State.  |
|  |  |
| **Dependencies** | **Member Health Profiles** for including member health profile in biometric alerts **Gym States Archive** for logging history of the gym state as it changes over time **Alert Log** for logging generated alerts **Report Generation Handler** for generating incremental reports |
|  |  |
| **Behavior** | Receives data from various handlers, archives it, and produces formatted alerts. The Data & Analytics Engine: Houses the **Gym State** and makes it readable to other components Writes new data to the **Gym State** Logs current **Gym State** to the **Gym States Archive** every five minutes. Produces alerts and saves them to the **Alert Log**  |
|  |  |

| Report Generation Handler |  |
| :---- | :---- |
| Generates reports on regular increments. Saves reports to the **Reports Archive**. |  |
| **State** |  reportTemplates Predefined layout configs for the four intervals: Hourly, Daily, Weekly, Monthly  |
|  |  |
| **Interface** |  bufferMetrics(MetricsLoad) Receives metrics from Data & Analytics to be included in the next report compileReport(ReportType…)  |
|  |  |
| **Dependencies** | **Gym State** (**Data & Analytics Engine**) **Reports Archive** for saving generated reports **Alert Log** for including alerts in reports (dependent on report range) **Gym States Archive** for including a history of gym states (dependent on report range) |
|  |  |
| **Behavior** | Generates formatted reports on set regular intervals from synthesized data. Saves them to the **Reports Archive**. |
|  |  |

|  Gym Management Portal Handler |  |
| :---- | :---- |
| Hosts a web REST and Web Socket API for interaction from the mobile app. Handles and routes requests from the mobile app. |  |
| **State** |  WebSocketConnections Must monitor connections from connected web sockets  |
|  |  |
| **Interface** | All of these methods have an associated HTTP API to make them accessible via the web app: getAlerts() \-\> AlertInfos Returns a list of info on alerts. Needs to be specified by a time range or pagination. viewAlert(AlertId) Get information and body of a specific alert for display to a user dismissAlert(AlertId) Dismisses an action-required alert via a call to **Data & Analytics Engine**’s dismissAlert. getReports() \-\> ReportInfos Returns a list of info on reports available to view. Needs to be specified by a time range or pagination. viewReport(ReportId) \-\> Report Returns the generated report data for a report so it can be rendered and displayed to the user subscribeGymState(Callback): Subscription\<GymState\> Listens to changes in the gym state with a callback (Implemented via a WebSocket in the Web API) getGymStates(Timerange) \-\> List\<GymState\> Returns a list of Gym States in the time range getMemberProfile(MemberId) \-\> MemberProfile Returns the member’s health profile updateMemberProfile(NewData) Updates a member’s health profile with new data getVideoClip(VideoClipId) \-\> VideoClip Returns the video clip for playback assignWristband(WristbandId, MemberId) Calls **WristbandHandler**’s pairWristband to to assign a wristband to a member. onWristbandReturned(WristbandI) Calls **WristbandHandler**’s unpairWristband to unassign a wristband from a member.  |
|  |  |
| **Dependencies** | **Data Stores** for returning requested data **Gym State** (**Data & Analytics Engine**) for dismissing alerts **Data & Analytics Engine** for modifying gym state **Wristband Handler** for assigning wristbands to members |
|  |  |
| **Behavior** | Provides REST API and Web Sockets for the Gym Management Portal App |
|  |  |

| Gym Management Portal App |  |
| :---- | :---- |
| Allows user interaction with the system via requests to the **Gym Management Portal Handler.** Available on Web and Mobile. |  |
| **State** |  currentUser Authenticated staff session Web Sockets Subscribed web sockets UI State Broad state for managing and displaying user interactions  |
|  |  |
| **Interface** |  **User actions:** **Report Browsing**  **Real-Time and Historical Graph of Gym States**  **Alert Notifications**  **Alert Browsing**  **Alert Dismissal**  **Member Profile Browsing**  **Member Profile Updating**  **Wristband Assigning**  **Wristband Returning**   |
|  |  |
| **Dependencies** | **Gym Management Portal Handler** for web API to query from and interact with the system *Native push notification service* |
|  |  |
| **Behavior** | Notifies staff on new action-required alerts |
|  |  |

## 

## Data Stores {#data-stores}

Various data are collected, stored, and read by the SGMS.

* **Member Health Profiles**  
  Stores member-disclosed information about health, custom heart rate thresholds, etc.

* **Gym States Archive**  
  Stores historical, periodic logs of the gym state for usage and analysis in the SGMS.

* **Reports Archive**  
  Stores archived routine reporting for access by gym management.

* **Video Clips Archive**  
  Stores archived video clips where abnormalities were detected for usage in reporting and alerts.

* **Alert Log**  
  Stores logged alert information for querying by the mobile app and handles new logged alerts

# 

# 4\. Sample Use Cases {#4.-sample-use-cases}

User-perspective use cases described in the Software Requirement Specifications have been functionally detailed here. This section is meant to be understood in tandem with those use cases. The situation depicted in each use case has been broken down into the system functions occurring during the use case.

### Use Case 1: Critical Safety Event Detection {#use-case-1:-critical-safety-event-detection}

| Field | Detail |
| ----: | :---- |
| **Goal in Context** | To rapidly identify a member in physical distress and receive a verifiable alert so staff can respond immediately in person. |
| **Preconditions** | Cameras are active and cover all functional gym zones. At least one staff member is on duty with the portal app open on their device. |
| **Trigger** | A gym member experiences a physical emergency (such as a fall) within a monitored zone. |

**Architecture Design Flow**

1. **Camera** feed observes the member falling to the floor.  
2. **MLLM Handler** sends an incremental clip to **Gemini 3.1 Pro** which returns a response flagging the clip as a critical injury alert.  
3. **MLLM Handler** routes the alert to the **Data & Analytics Engine** via a call to onVideoAlert.  
4. **Data & Analytics Engine** packages the alert and adds it to the **Alert Log** and as a current alert in the **Gym State**.  
5. The **Gym Management Portal App** receives the push notification via native device push notification API. Staff devices show the critical alert.  
6. Staff opens the alert in the **Gym Management Portal App** which loads the alert data with a call to the **Gym Management Portal Handler’s** viewAlert. The app also makes a call to retrieve the associated video clip from the **Video Clips Archive**. It uses this data to render and display the alert to the user with the attached video clip.  
7. Staff handle the alert and dismiss it. The **Gym Management Portal App** calls **Gym Management Portal Handler’s** dismissAlert.  
8. **Gym Management Portal Handler** removes the alert from the current **Gym State** by calling **Data & Analytics Engine’s** dismissAlert.

### 

### Use Case 2: Environmental Monitoring and Hazard Detection {#use-case-2:-environmental-monitoring-and-hazard-detection}

| Field | Detail |
| ----: | :---- |
| **Goal in Context** | To be alerted when environmental conditions in the facility exceed safe or comfortable levels so staff can investigate and take corrective action. |
| **Preconditions** | Environmental sensors are installed, calibrated, and actively streaming readings. Comfort and safety thresholds are defined in the system. The portal app is accessible to on-duty staff. |
| **Trigger** | A sensor detects a reading such as a rise in CO2, temperature, or VOCs that exceeds a defined threshold. |

**Architecture Design Flow**

1. The **Environmental Sensor Handler** calls the **IoT Gateway**'s pollSensor interface to read the latest data.  
1. The **Environmental Sensor Handler** compares the sensor reading against its internal zoneThresholds and classifies the event as a \[Warning\] severity alert, updating its zoneStatus state and current readings.  
2. The **Environmental Sensor Handler** routes the processed environmental reading and the Warning severity to the **Data & Analytics Engine** via the onSensorProcess interface.  
3. The **Data & Analytics Engine** logs the environmental data to the **Gym State** and produces a formatted alert, adding it to the **Alert Log** and as a current alert in the **Gym State**.  
4. The **Gym Management Portal App** receives the push notification via the native device push notification API. Staff devices display the Warning alert.  
5. Staff open the alert in the **Gym Management Portal App**, which calls the **Gym Management Portal Handler**’s viewAlert to load the alert data and attached sensor readings for display.  
6. Staff handle the physical issue and then dismiss the alert. The **Gym Management Portal App** calls the **Gym Management Portal Handler**’s dismissAlert.  
7. **Gym Management Portal Handler** removes the alert from the current **Gym State** by calling **Data & Analytics Engine’s** dismissAlert.

### 

### Use Case 3: Biometric Wearable Data Processing {#use-case-3:-biometric-wearable-data-processing}

| Field | Detail |
| ----: | :---- |
| **Goal in Context** | For a member to voluntarily enroll in biometric monitoring for a session, enabling the system to support their safety while they exercise, and to cleanly exit that monitoring when their session ends. |
| **Preconditions** | Biometric wristbands are available at the facility. The member has a profile in the system. Staff are present at the front desk to issue and register the device. |
| **Trigger** | A gym member arrives and is offered a biometric wristband for their session, or proactively requests one. |

**Architecture Design Flow**

**Wristband Assignment and Monitoring Start**

2. Staff use the **Gym Management Portal App** (User action: **Wristband Assigning**) to initiate the wristband pairing for a member given the member’s consent.  
3. The **Gym Management Portal App** calls the **Gym Management Portal Handler’s** updateMemberProfile interface (to save optional health data).  
4. The **Gym Management Portal App** calls the **Gym Management Portal Handler**’s assignWristband interface.  
5. The **Gym Management Portal Handler** routes the request by calling the **Wristband Handler**’s pairWristband interface.  
6. The **Wristband Handler** updates its activeSessions state and retrieves the member's personalized thresholds from the **Member Health Profiles** Data Store, storing them in its memberThresholds.  
7. The **Wristband Handler** initiates continuous data ingestion by calling the **IoT Gateway**’s pollWristband interface.  
8. Upon this call, the **IoT Gateway** reads the BiometricReading from the **Wristband Hardware** and returns it to the **Wristband Handler** for processing.

**Wristband Deassignment and Session End**

1. The member finishes their session and returns their wristband. Staff use the **Gym Management Portal App** to initiate the deregistration.  
2. The **Gym Management Portal App** calls the **Gym Management Portal Handler**’s unpairWristband interface.  
3. The **Gym Management Portal Handler** routes the unpairing request by calling the **Wristband Handler**’s unpairWristband interface.  
9. The **Wristband Handler** updates its activeSessions state, ending the biometric monitoring session.

### 

### Use Case 4: Warning Health Event Detection {#use-case-4:-warning-health-event-detection}

| Field | Detail |
| ----: | :---- |
| **Goal in Context** | To receive a timely, data-backed warning when a member shows unusual physiological signals, so staff can conduct a non-medical wellness check before the situation worsens. |
| **Preconditions** | The member has been issued a biometric wristband, consented to biometric monitoring for the session, and their health profile and personalized alert thresholds are on file. |
| **Trigger** | The member's wristband detects a sustained heart rate reading that breaches their personalized threshold during exercise. |

**Architecture Design Flow**

**Warning Health Event Detection and Alerting**

1. The **Wristband Handler** calls the **IoT Gateway**'s pollWristband interface regularly to read the latest biometric data from a paired wristband.  
2. The **Wristband Handler** compares the received heart rate reading against the personalized (if stored in memberThresholds) or default health thresholds and detects a breach, classifying it as a \[Warning\] severity alert.  
3. The **Wristband Handler** routes the processed BiometricReading and the Warning severity to the **Data & Analytics Engine** via the onBiometricAlert interface.  
4. The **Data & Analytics Engine** receives the alert, logs the biometric data, produces a formatted alert (including necessary context from **Member Health Profiles**), and adds the alert to the **Alert Log** and as a current alert in the **Gym State**.  
5. The **Gym Management Portal App** receives the push notification via the native device push notification API. Staff devices display the Warning alert.  
6. Staff open the alert in the **Gym Management Portal App**, which loads the alert data and the attached heart rate trend by calling the **Gym Management Portal Handler**’s viewAlert interface.  
7. Staff dismiss the alert after addressing the member's well-being. The **Gym Management Portal App** calls the **Gym Management Portal Handler**’s dismissAlert interface.  
8. The **Gym Management Portal Handler** removes the alert from the current **Gym State** by calling the **Data & Analytics Engine’s** dismissAlert interface.

### 

### Use Case 5: Facility Data Visibility and Archival Logging {#use-case-5:-facility-data-visibility-and-archival-logging}

| Field | Detail |
| ----: | :---- |
| **Goal in Context** | To look up historical system activity (such as a past alert, sensor data log, or usage records) to cross-reference against something occurring in the present and make a more informed operational decision. |
| **Preconditions** | The staff member is logged into the Gym Management Portal. Historical data for the relevant time period exists in the archive. |
| **Trigger** | A staff member encounters a current situation (such as a recurring alert or a member complaint) and wants to verify whether it has happened before or retrieve prior context. |

**Architecture Design Flow**

1. Staff initiates a historical data query (e.g., searching for alerts by zone or time range) on the **Gym Management Portal App** (User action: **Alert Browsing** or **Real-Time and Historical Graph of Gym States**).  
2. The **Gym Management Portal App** calls the appropriate data retrieval interface on the **Gym Management Portal Handler**:  
   \- To search for historical alerts, it calls getAlerts.  
   \- To retrieve historical gym state data (sensor readings, occupancy counts), it calls getGymStates.  
3. The **Gym Management Portal Handler** interacts with the necessary **Data Stores** to fetch the archived information:  
   \- getAlerts queries the **Alert Log**.  
   \- getGymStates queries the **Gym States Archive**.  
4. The **Gym Management Portal Handler** returns the list of historical records to the **Gym Management Portal App**.  
5. Staff selects a specific historical alert for detailed review.  
6. The **Gym Management Portal App** calls the specific detail retrieval interfaces on the **Gym Management Portal Handler**:  
   \- To view alert details, it calls viewAlert.  
   \- To retrieve a linked video clip, it calls getVideoClip.  
7. The **Gym Management Portal Handler** retrieves the specific details from the respective **Data Stores** (the **Alert Log** for alert info and the **Video Clips Archive** for source video) and returns the data to the **Gym Management Portal App** for display.

### 

### Use Case 6: Observational Report Generation {#use-case-6:-observational-report-generation}

| Field | Detail |
| ----: | :---- |
| **Goal in Context** | To review a structured report of facility activity over time in order to identify recurring safety concerns, underutilized equipment, peak usage patterns, and member behavior that may require management action. |
| **Preconditions** | The management user is logged into the Gym Management Portal. At least one full reporting period has elapsed and a report has been generated for that period. |
| **Trigger** | A report period ends (such as the close of a week) and Gym Management logs in to review the generated report. |

**Architecture Design Flow**

1. The **Report Generation Handler** generates a report on a regular (weekly) interval (triggered by internal timer).  
2. The handler retrieves metrics from the **Gym States Archive**, **Alert Log**, and **Gym State** for the relevant time period.  
3. The handler generates a report with the data and saves it to the **Reports Archive**.  
4. A Gym Management user logs into the **Gym Management Portal App** and performs the **Report Browsing** action.  
5. The app calls the **Gym Management Portal Handler**’s getReports interface.  
6. The user selects the latest weekly report, and the app calls viewReport.  
7. The handler retrieves the report file from the **Reports Archive** and returns it to the app for display to the user.

# 5\. Design Constraints {#5.-design-constraints}

This section outlines the external limitations imposed on the SGMS. These constraints represent factors beyond the development team's control, such as third-party API behavior, physical laws, and legal mandates, which the architecture must accommodate to remain viable and safe.

## 5.1 Technical and Performance Constraints {#5.1-technical-and-performance-constraints}

* **Critical Latency Mandate**: Safety standards require that the path from a physical hardware trigger (such as a detected fall) to a staff push notification must not exceed **5 seconds**.  
* **Third-Party API Limitations**: The Gemini 3.1 Pro MLLM service imposes strictly defined rate limits and per-token costs, necessitating an architecture that optimizes data payloads. Additionally, the software must be structured around utilizing provided APIs from Google to use Gemini 3.1 Pro.  
* **Asynchronous Data Reconciliation**: The system must reconcile inherently asynchronous data streams from visual, IAQ, and physiological sensors into a singular, synchronized Gym State.  
* **Native Push Notification API Usage:** To ensure reliable notification delivery to staff mobile devices at all times, the system must interface directly with platform-native push notification services.  
* **Edge Survivability:** In the event of a local area network (LAN) failure, the IoT Gateway must maintain a local buffer of environmental data to prevent data loss for the next Report.  
* **MLLM Fail-over:** If the connection to the Gemini 3.1 Pro API is lost, the MLLM Handler must switch to a "Local Heuristics" mode, using simple motion-detection thresholds to maintain a baseline of activity monitoring until cloud connectivity is restored.  
* **State integrity:** Updates to the Gym State must be atomic. An occupancy increment must be fully committed before an “Over Capacity” check is performed to avoid race conditions.

## 5.2 Regulatory and Legal Constraints {#5.2-regulatory-and-legal-constraints}

* **Privacy Law Compliance**: Regulations including BIPA, CCPA, and GDPR mandate the automated purging of video archives every 30 days unless flagged for a legal hold.  
* **Biometric Consent Restrictions**: Legal mandates require support for an "Opt-In" model; the architecture must provide anonymized skeleton tracking for members who have not provided biometric consent.  
* **Mandatory Cryptographic Standards**: All stored physiological data and member health profiles are legally required to be encrypted using AES-256 standards.  
* **Medical Practice Prohibition**: The system is legally prohibited from diagnosing medical conditions or prescribing treatments and must operate strictly as a safety and logistics tool.

## 5.3 Operational Constraints {#5.3-operational-constraints}

* **Unreliable Network Infrastructure**: The architecture must account for the high probability of network  failures and intermittent cloud API connectivity by utilizing fallback modes.  
* **Facility Bandwidth**: Variable facility upload speeds impact the streaming of raw video, so video clip uploading to Gemini 3.1 Pro must be adjusted accordingly.  
* **Human-in-the-Loop Requirement**: Safety protocols forbid the system from autonomously dismissing "Critical" or "Warning" events; manual staff verification is an external operational mandate.  
* **Physical Fault Isolation**: Hardware failures are statistically inevitable; the architecture must ensure that a failure in one hardware stream (e.g., a camera or wristband) does not interrupt or degrade the performance of other handlers.  
* **High Availability Mandate**: To ensure member safety, the system is required to maintain 99% uptime during all facility operational hours.  
* **Emergency Priority Protocol**: Safety mandates that staff attention be locked to active "Critical" alerts, strongly discouraging access to non-emergency dashboard views until the event is acknowledged.

# 6\. Definition of Terms {#6.-definition-of-terms}

* **Smart Gym Management System (SGMS):** The integrated hardware and software system responsible for monitoring gym availability, enhancing user experience, and processing data within the gym.  
* **Environmental Sensors:** Hardware devices deployed throughout the facility to continuously monitor temperature, humidity, and air quality.  
* **Air Quality:** A composite measurement of airborne conditions including CO₂ concentration, particulate matter, and volatile organic compounds captured by environmental sensors.  
* **Wearable Biometric Devices:** Gym-provided devices issued to members at entry that capture real-time physiological signals (only heart rate for initial release) during a session.  
* **Immediate Alerts:** Time-sensitive notifications delivered to on-duty staff through the Gym Management Portal App when a Warning- or Critical-level event is detected, always accompanied by raw source data for verification.  
* **Alert Levels:** A three-tier classification system (Informational, Warning, and Critical) used to categorize detected events by severity and determine the appropriate staff notification response.  
* **Data & Analytics Engine:** Orchestrates and unifies data streams, alerts, handles calls to the MLLM interface. Processes and produces routine reports.  
* **Routine Reports:** Periodic data summaries generated at hourly, daily, weekly, and monthly intervals that synthesize camera, wearable, and sensor data into visualizations for management review.  
* **Gym Management Portal App:** The primary staff- and management-facing interface, accessible via a web-based dashboard and iOS/Android app, used for receiving alerts and accessing reports.  
* **Higher-Risk Individuals:** Members who have voluntarily disclosed health conditions or personal circumstances that warrant closer, non-medical monitoring with tailored alert thresholds.  
* **Multimodal Large Language Model (MLLM):** A generative AI model capable of processing multiple data types simultaneously, such as video, images, and sensor readings, whose outputs are treated as unverified until cross-checked with raw source data.  
* **Camera Feeds:** Video streams from facility-mounted cameras used for occupancy tracking, fall detection, equipment usage analysis, and anonymized movement monitoring.  
* **Member:** A registered individual with an active gym membership who may use facility equipment and optionally participate in biometric monitoring via the provided wearable device.  
* **Management:** Gym administrators who access routine reports, analytics dashboards, and system configuration through the management website to inform facility-level decisions.  
* **On-Duty Staff:** Any trainer or staff member currently working a shift and actively receiving push notifications from the SGMS alerting system.  
* **Opt-In Model:** A consent configuration in which members must explicitly sign a waiver to activate personalized biometric monitoring and identity-linked tracking (the default model).  
* **Opt-Out Model:** An alternative consent configuration in which personalized monitoring is enabled for all members upon enrollment, with the option to decline at any time.

# 7\. Conclusion {#7.-conclusion}

The architectural framework for the Smart Gym Management provides a robust foundation for transforming complex, multimodal sensor telemetry into safety interventions. By centralizing logic within the Data & Analytics Engine and leveraging the advanced reasoning of Gemini 3.1 Pro, the system successfully bridges the gap between probabilistic AI analysis and deterministic gym safety. This modular, handler-based design ensures that the system remains scalable and resilient, prioritizing human-in-the-loop accountability and member privacy at every stage of the data pipeline. Ultimately, the SGMS stands as a sophisticated, future-proof blueprint for modern fitness environments, ensuring that while members focus on their performance, the architecture is working silently to guarantee their security.

## 7.1 Demo Plan {#7.1-demo-plan}

For our demo, we plan to implement camera feed and basic biometric monitoring in a mock-gym setting. The MLLM Handler will be adapted for manual 5-second clip capture to save on token costs since we have no budget for this project. Environmental sensors will be omitted from the demo for lack of hardware. Basic biometric monitoring can be performed with an EmotiBit borrowed from the UNM ARTSLab. A basic interface representing the portal app will be implemented to show alerts happening based on Gemini 3.1 Pro’s understanding of manually captured clips. Without extensive data, report generation is not very interesting, so it will be omitted from the demo. Instead, we will focus on real-time dashboards and alerting. This demo will match data flow between components, with the **Environmental Sensor Handler**, **Report Generation Handler**, and **Reports Archive** omitted. Use cases instantiated will be 1,3,4,and 5\.

### Timeline: {#timeline:}

| Week 1 (April 27 \- May 3\) | Implement basic functionality, including: Project structure matching architecture diagram Basic member profiles Biometric monitoring Sending video clips to the Gemini API and parsing analysis Detect alerts in the system |
| :---- | :---- |
| Week 2 (May 4 \- May 10\) | Refine project and develop a clear user interface for the demo: Build out the UI and develop a clear demo including real-time graphs and alerts Test functionality, bugfix |

# 

# 8\. References {#8.-references}

\[1\] J. Saias and J. Bravo, “Sensor-Based Real-Time Monitoring Approach for Multi-Participant Workout Intensity Management,” Electronics, 2024\. \[Online\]. Available: https://www.mdpi.com/2079-9292/13/18/3687. Accessed: Mar. 27, 2026\.

\[2\] Google AI for Developers, “Gemini 3.1 Pro Preview,” Google AI for Developers, 2026\. \[Online\]. Available: [https://ai.google.dev/gemini-api/docs/models/gemini-3.1-pro-preview](https://ai.google.dev/gemini-api/docs/models/gemini-3.1-pro-preview). Accessed: Apr. 16, 2026\. 

# 

[image1]: <data:image/png;base64,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>
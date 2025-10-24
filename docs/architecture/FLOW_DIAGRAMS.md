# Cardiology Suite - Visual Architecture Diagrams

## 1. MERMAID FLOWCHART - Complete Application Flow

```mermaid
graph TB
    subgraph "Entry Point"
        A[index.html] --> B[src/core/app.js]
        B --> C{DOMContentLoaded}
    end
    
    subgraph "Initialization"
        C --> D[Load Feature Flags]
        C --> E[Initialize Theme]
        C --> F[Setup Routing]
        C --> G[Initialize Interactions]
        D --> D1[config/features.json]
    end
    
    subgraph "Parser System"
        H[User Input] --> I[templateRenderer.processNote]
        I --> J[window.parseClinicalNote]
        J --> K[smartParser.parseNote]
        K --> L[normalize.js]
        K --> M[entityExtraction.js]
        K --> N[synonyms.js]
        L --> O{Parsed Object}
        M --> O
        N --> O
        O --> P[templateRenderer.normalizeSections]
        P --> Q[generateAssessment]
        P --> R[generatePlan]
        Q --> S[Formatted Output]
        R --> S
    end
    
    subgraph "AI Enhancement"
        S --> T{Enhance with AI?}
        T -->|Yes| U[aiAnalyzer.enrichWithAIAnalysis]
        U --> V[POST /api/analyze-note]
        V --> W[services/ai-search]
        W --> X[Azure OpenAI]
        X --> Y[Enhanced Result]
        Y --> Z[Display with AI Insights]
        T -->|No| Z
    end
    
    subgraph "Search & RAG"
        AA[User Query] --> AB[runSearch]
        AB --> AC[POST /search]
        AC --> W
        W --> AD[Azure Search]
        AD --> AE[Search Results]
        AE --> AF{Need Answer?}
        AF -->|Yes| AG[POST /api/medical-qa]
        AG --> AH[searchGuidelines]
        AH --> AD
        AH --> AI[Build RAG Context]
        AI --> X
        X --> AJ[Answer with Citations]
        AF -->|No| AE
    end
    
    subgraph "Data Loading"
        D1 --> AK[Feature Flags]
        AL[data/cardiology_diagnoses/] --> AM[Diagnosis Data]
        AN[data/labs_reference/] --> AO[Lab Reference]
        AP[data/diagnosis_whitelist.json] --> AQ[diagnosisSanitizer]
        AR[data/diagnosis_blacklist.json] --> AQ
    end
    
    subgraph "Routing"
        F --> AS{Hash Change}
        AS --> AT[#/main - renderMain]
        AS --> AU[#/guidelines - renderGuidelines]
        AS --> AV[#/meds - renderMeds]
        AS --> AW[#/education - renderEducation]
    end
    
    style B fill:#f9f,stroke:#333,stroke-width:4px
    style J fill:#bbf,stroke:#333,stroke-width:2px
    style W fill:#bfb,stroke:#333,stroke-width:2px
    style X fill:#fbb,stroke:#333,stroke-width:2px
    style AD fill:#fbb,stroke:#333,stroke-width:2px
```

## 2. MERMAID SEQUENCE DIAGRAM - Clinical Note Parsing Flow

```mermaid
sequenceDiagram
    participant User
    participant UI as templateRenderer UI
    participant Parser as window.parseClinicalNote
    participant Smart as smartParser
    participant Extract as entityExtraction
    participant Norm as normalize
    participant Syn as synonyms
    participant Render as templateRenderer
    participant AI as aiAnalyzer
    participant Service as AI Search Service
    participant Azure as Azure OpenAI
    
    User->>UI: Paste clinical note
    UI->>Parser: processNote(text)
    Parser->>Smart: parseNote(rawText)
    
    Smart->>Norm: normalize(text)
    Norm-->>Smart: Normalized text
    
    Smart->>Syn: scoreMatch(headers)
    Syn-->>Smart: Section scores
    
    Smart->>Extract: extractVitals(text)
    Smart->>Extract: extractMeds(text)
    Smart->>Extract: extractDiagnoses(text)
    Smart->>Extract: extractLabs(text)
    Extract-->>Smart: Extracted entities
    
    Smart-->>Parser: Parsed object
    Parser-->>UI: Parsed data
    
    UI->>Render: normalizeSections(data)
    Render->>Render: generateAssessment()
    Render->>Render: generatePlan()
    Render-->>UI: Formatted output
    
    UI->>User: Display result
    
    opt AI Enhancement
        User->>UI: Click "Enhance with AI"
        UI->>AI: enrichWithAIAnalysis(baseResult, note)
        AI->>Service: POST /api/analyze-note
        Service->>Azure: Chat completion request
        Azure-->>Service: AI insights
        Service-->>AI: Enhanced data
        AI-->>UI: Merged result
        UI->>User: Display AI insights
    end
```

## 3. MERMAID SEQUENCE DIAGRAM - Medical Q&A with RAG

```mermaid
sequenceDiagram
    participant User
    participant UI as App UI
    participant Search as runSearch()
    participant Server as AI Search Server
    participant AzSearch as Azure Search
    participant QA as medical-qa API
    participant OpenAI as Azure OpenAI
    
    User->>UI: Enter medical question
    UI->>Search: runSearch(query, top=5)
    Search->>Server: POST /search
    Server->>AzSearch: Search query
    AzSearch-->>Server: Top K documents
    Server-->>Search: Search results
    Search-->>UI: Display results
    
    opt Get Full Answer
        User->>UI: Click for detailed answer
        UI->>QA: POST /api/medical-qa
        QA->>AzSearch: searchGuidelines(question)
        AzSearch-->>QA: Relevant guidelines
        
        QA->>QA: Build RAG context
        Note over QA: Concatenate documents<br/>into context string
        
        QA->>OpenAI: Chat completion with context
        OpenAI-->>QA: Generated answer
        
        QA->>QA: Calculate confidence
        QA-->>UI: {answer, sources, confidence}
        UI->>User: Display answer with citations
    end
```

## 4. DEPENDENCY GRAPH - Module Relationships

```mermaid
graph LR
    subgraph "Core"
        APP[app.js<br/>Entry Point]
    end
    
    subgraph "Parsers"
        NP[noteParser.js<br/>Global Attachment]
        SP[smartParser.js<br/>Main Logic]
        TR[templateRenderer.js<br/>Formatting]
        NPA[noteParser_full_async.js<br/>Async Version]
    end
    
    subgraph "Extraction"
        EE[entityExtraction.js<br/>Entity Parser]
        NORM[normalize.js<br/>Text Normalization]
        SYN[synonyms.js<br/>Pattern Matching]
    end
    
    subgraph "AI Layer"
        AI[aiAnalyzer.js<br/>AI Enhancement]
        AIA[services/ai-search<br/>Express Server]
    end
    
    subgraph "Utils"
        SCHED[scheduler.js<br/>Async Helpers]
        DEBUG[debugInstrumentation.js<br/>Error Tracking]
        SANIT[diagnosisSanitizer.js<br/>Filtering]
    end
    
    subgraph "External"
        AZURE_SEARCH[Azure Search<br/>REST API]
        AZURE_AI[Azure OpenAI<br/>Chat API]
    end
    
    APP --> NP
    APP --> TR
    APP --> AI
    APP --> DEBUG
    
    NP --> SP
    TR --> NP
    
    SP --> EE
    SP --> NORM
    SP --> SYN
    
    NPA --> SCHED
    NPA --> EE
    
    AI --> AIA
    AIA --> AZURE_SEARCH
    AIA --> AZURE_AI
    
    TR --> SANIT
    
    style APP fill:#f9f,stroke:#333,stroke-width:4px
    style SP fill:#bbf,stroke:#333,stroke-width:2px
    style TR fill:#bbf,stroke:#333,stroke-width:2px
    style AIA fill:#bfb,stroke:#333,stroke-width:2px
    style AZURE_SEARCH fill:#fbb,stroke:#333,stroke-width:2px
    style AZURE_AI fill:#fbb,stroke:#333,stroke-width:2px
```

## 5. COMPONENT INTERACTION DIAGRAM

```mermaid
graph TB
    subgraph "Frontend SPA"
        UI[User Interface<br/>index.html + CSS]
        ROUTER[Hash Router<br/>app.js routing]
        MAIN[Main Page<br/>Note Parsing]
        GUIDE[Guidelines Page<br/>Evidence Browser]
        MED[Meds Page<br/>Drug Reference]
    end
    
    subgraph "Parser Pipeline"
        INPUT[Text Input]
        PARSE[Parser Chain<br/>noteParser → smartParser]
        ENTITY[Entity Extraction<br/>Vitals, Meds, Labs, Dx]
        TEMPLATE[Template Renderer<br/>CIS, Consult, Progress]
        OUTPUT[Formatted Output]
    end
    
    subgraph "AI Services"
        AI_SERVER[AI Search Server<br/>Express :8081]
        ANALYZE[/api/analyze-note<br/>Note Analysis]
        SEARCH[/search<br/>Guideline Search]
        QA[/api/medical-qa<br/>Q&A Endpoint]
        PARA[/api/paraphrase-hpi<br/>HPI Rewriter]
    end
    
    subgraph "Azure Backend"
        FUNC[Azure Functions<br/>Serverless API]
        SEARCH_SVC[Azure Search<br/>Vector Search]
        AI_SVC[Azure OpenAI<br/>GPT-4]
    end
    
    subgraph "Data Sources"
        CONFIG[config/features.json<br/>Feature Flags]
        DX_DATA[data/cardiology_diagnoses/<br/>Diagnosis DB]
        LAB_DATA[data/labs_reference/<br/>Lab Ranges]
    end
    
    UI --> ROUTER
    ROUTER --> MAIN
    ROUTER --> GUIDE
    ROUTER --> MED
    
    MAIN --> INPUT
    INPUT --> PARSE
    PARSE --> ENTITY
    ENTITY --> TEMPLATE
    TEMPLATE --> OUTPUT
    OUTPUT --> UI
    
    MAIN --> ANALYZE
    MAIN --> SEARCH
    GUIDE --> SEARCH
    MAIN --> QA
    MAIN --> PARA
    
    ANALYZE --> AI_SERVER
    SEARCH --> AI_SERVER
    QA --> FUNC
    PARA --> AI_SERVER
    
    AI_SERVER --> SEARCH_SVC
    AI_SERVER --> AI_SVC
    FUNC --> SEARCH_SVC
    FUNC --> AI_SVC
    
    ROUTER --> CONFIG
    MAIN --> DX_DATA
    MAIN --> LAB_DATA
    
    style UI fill:#e1f5fe,stroke:#01579b,stroke-width:2px
    style AI_SERVER fill:#c8e6c9,stroke:#1b5e20,stroke-width:2px
    style FUNC fill:#c8e6c9,stroke:#1b5e20,stroke-width:2px
    style SEARCH_SVC fill:#ffccbc,stroke:#bf360c,stroke-width:2px
    style AI_SVC fill:#ffccbc,stroke:#bf360c,stroke-width:2px
```

## 6. DATA FLOW DIAGRAM - Clinical Note Processing

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER INPUT LAYER                        │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
                    [Clinical Note Text]
                               │
┌─────────────────────────────────────────────────────────────────┐
│                      PREPROCESSING LAYER                        │
│  ┌────────────┐   ┌────────────┐   ┌────────────┐            │
│  │ normalize  │   │  Trim &    │   │   Split    │            │
│  │   Text     │──>│  Sanitize  │──>│   Lines    │            │
│  └────────────┘   └────────────┘   └────────────┘            │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SECTION DETECTION LAYER                      │
│  ┌────────────┐   ┌────────────┐   ┌────────────┐            │
│  │  Synonym   │   │   Score    │   │  Assign    │            │
│  │  Matching  │──>│  Headers   │──>│  Sections  │            │
│  └────────────┘   └────────────┘   └────────────┘            │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                   ENTITY EXTRACTION LAYER                       │
│  ┌────────────┐   ┌────────────┐   ┌────────────┐            │
│  │  Extract   │   │  Extract   │   │  Extract   │            │
│  │   Vitals   │   │    Meds    │   │    Labs    │            │
│  └────────────┘   └────────────┘   └────────────┘            │
│  ┌────────────┐   ┌────────────┐   ┌────────────┐            │
│  │  Extract   │   │  Extract   │   │Disambiguate│            │
│  │  Allergies │   │ Diagnoses  │   │  Entities  │            │
│  └────────────┘   └────────────┘   └────────────┘            │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                      PARSED DATA OBJECT                         │
│  {                                                              │
│    sections: { HPI, PMH, PSH, ROS, ASSESSMENT, PLAN },        │
│    vitals: { BP, HR, RR, Temp, SpO2 },                        │
│    meds: [...],                                                │
│    diagnoses: [...],                                            │
│    labs: { ... },                                              │
│    meta: { confidence, warnings }                              │
│  }                                                              │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                    TEMPLATE RENDERING LAYER                     │
│  ┌────────────┐   ┌────────────┐   ┌────────────┐            │
│  │ Normalize  │   │  Generate  │   │  Generate  │            │
│  │  Sections  │──>│ Assessment │──>│    Plan    │            │
│  └────────────┘   └────────────┘   └────────────┘            │
│                            │                                    │
│                            ▼                                    │
│  ┌────────────┐   ┌────────────┐   ┌────────────┐            │
│  │    CIS     │   │  Consult   │   │  Progress  │            │
│  │  Template  │   │  Template  │   │   Note     │            │
│  └────────────┘   └────────────┘   └────────────┘            │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                      FORMATTED OUTPUT TEXT                      │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼ (Optional AI Enhancement)
┌─────────────────────────────────────────────────────────────────┐
│                       AI ENHANCEMENT LAYER                      │
│  ┌────────────┐   ┌────────────┐   ┌────────────┐            │
│  │   Azure    │   │  Extract   │   │   Merge    │            │
│  │  OpenAI    │──>│  Insights  │──>│   Results  │            │
│  └────────────┘   └────────────┘   └────────────┘            │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
                     [Enhanced Output to User]
```

## 7. GRAPHVIZ DOT FORMAT - Full System Architecture

```dot
digraph CardiologySuite {
    rankdir=LR;
    node [shape=box, style=filled];
    
    // Entry points
    index_html [label="index.html\nEntry Point", fillcolor=pink];
    app_js [label="src/core/app.js\nBootstrap", fillcolor=pink];
    
    // Parser subsystem
    noteParser [label="noteParser.js\nGlobal Attachment", fillcolor=lightblue];
    smartParser [label="smartParser.js\nMain Parser", fillcolor=lightblue];
    templateRenderer [label="templateRenderer.js\n3481 lines\nFormatting", fillcolor=lightblue];
    
    // Extraction
    entityExtraction [label="entityExtraction.js\nEntity Parser", fillcolor=lightyellow];
    normalize [label="normalize.js\nText Normalization", fillcolor=lightyellow];
    synonyms [label="synonyms.js\nPattern Matching", fillcolor=lightyellow];
    
    // AI Layer
    aiAnalyzer [label="aiAnalyzer.js\nAI Enhancement", fillcolor=lightgreen];
    ai_search_server [label="services/ai-search\nExpress Server\nPort 8081", fillcolor=lightgreen];
    
    // Azure
    azure_search [label="Azure Search\nVector Search", fillcolor=salmon];
    azure_openai [label="Azure OpenAI\nGPT-4", fillcolor=salmon];
    
    // APIs
    azure_functions [label="api/\nAzure Functions\nServerless", fillcolor=lightgreen];
    
    // Data
    config [label="config/\nFeature Flags", fillcolor=lightgray];
    data [label="data/\nJSON Files\nDx, Labs, Meds", fillcolor=lightgray];
    
    // Edges - Entry flow
    index_html -> app_js;
    app_js -> noteParser;
    app_js -> templateRenderer;
    app_js -> aiAnalyzer;
    app_js -> config;
    app_js -> data;
    
    // Parser flow
    noteParser -> smartParser;
    smartParser -> entityExtraction;
    smartParser -> normalize;
    smartParser -> synonyms;
    templateRenderer -> smartParser;
    
    // AI flow
    aiAnalyzer -> ai_search_server;
    ai_search_server -> azure_search;
    ai_search_server -> azure_openai;
    azure_functions -> azure_search;
    azure_functions -> azure_openai;
    
    // Labeling
    {rank=same; index_html; app_js;}
    {rank=same; noteParser; smartParser; templateRenderer;}
    {rank=same; entityExtraction; normalize; synonyms;}
    {rank=same; aiAnalyzer; ai_search_server;}
    {rank=same; azure_search; azure_openai;}
}
```

## 8. ASCII ART - High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CARDIOLOGY SUITE                            │
│                     Privacy-First Clinical Tool                     │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  │
      ┌───────────────────────────┼───────────────────────────┐
      │                           │                           │
      ▼                           ▼                           ▼
┌──────────┐              ┌──────────────┐           ┌─────────────┐
│  User    │              │   Frontend   │           │   Backend   │
│Interface │◄────────────►│   Parser     │◄─────────►│  Services   │
│  (HTML)  │              │   Engine     │           │  (Express)  │
└──────────┘              └──────────────┘           └─────────────┘
      │                           │                           │
      │                           │                           │
      ▼                           ▼                           ▼
┌──────────┐              ┌──────────────┐           ┌─────────────┐
│  Hash    │              │   Template   │           │   Azure     │
│ Routing  │              │   Renderer   │           │  Functions  │
└──────────┘              └──────────────┘           └─────────────┘
      │                           │                           │
      │                           │                           │
      ▼                           ▼                           ▼
┌──────────┐              ┌──────────────┐           ┌─────────────┐
│ Feature  │              │  Entity      │           │   Azure     │
│  Pages   │              │ Extraction   │           │   Search    │
└──────────┘              └──────────────┘           └─────────────┘
                                  │                           │
                                  │                           │
                                  ▼                           ▼
                          ┌──────────────┐           ┌─────────────┐
                          │      AI      │           │   Azure     │
                          │  Enhancement │◄─────────►│   OpenAI    │
                          │   (Optional) │           │   (GPT-4)   │
                          └──────────────┘           └─────────────┘
```

---

*End of visual diagrams document*

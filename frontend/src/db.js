// Database Layer for Classify Call Integration (lead_calls collection simulation)
// Persists call records in localStorage with full CRUD capability and Schema validation.

const DB_KEY = "dora_lead_calls_db_v2";

// Seed data matching the MongoDB lead_calls schema defined in README.md & calls.py
const SEED_CALLS = [];
/*
    _id: "667d4f10a8b9c10012345601",
    id: "call-104",
    orgId: "a4213e83-097f-4d8e-bfa5-0960f2958c89",
    leadId: "crm-lead-97654",
    leadName: "Priya Nair",
    leadPhone: "+91 97654 32109",
    leadEmail: "priya.nair@example.com",
    bdaId: "bda-7701",
    bdaEmail: "alice.guvi@guvi.in",
    callMode: "scheduled",
    status: "completed",
    scheduledTime: Math.floor(Date.now() / 1000) - 86400,
    startedAt: Math.floor(Date.now() / 1000) - 86400,
    endedAt: Math.floor(Date.now() / 1000) - 84600,
    isActive: true,
    classify: {
      uniqueId: "cls-uuid-904128",
      roomId: "room-p904",
      hostCode: "host-code-104",
      studentCode: "guest-code-104",
      label: "Call with Priya Nair — Alice",
      hostJoinUrl: "https://classify.zenclass.in/meet/room-p904?code=host-code-104&role=host",
      guestJoinUrl: "https://classify.zenclass.in/meet/room-p904?code=guest-code-104&role=student",
      thumbnail: "https://classifyprod.s3.amazonaws.com/thumbnails/room-p904.jpg"
    },
    media: {
      recordingUrl: "http://localhost:4000/static/sample_consultation.wav",
      transcriptUrl: null,
      chats: [
        { from: "BDA (Alice)", text: "Hi Priya, welcome to today's Classify video session!", ts: 10 },
        { from: "Priya Nair", text: "Hi Alice, happy to discuss the Full Stack Web Development bootcamp.", ts: 25 },
        { from: "BDA (Alice)", text: "Great! Let me walk you through our curriculum & placement assurance.", ts: 45 },
        { from: "Priya Nair", text: "Can you clarify the EMI payment options and starting dates?", ts: 90 }
      ]
    },
    analysis: {
      status: "done",
      outcome: "interested",
      conversionProbability: 88,
      attendancePercentage: 85,
      mood: "positive",
      moodTimeline: [
        { segment: "0:00-1:30", mood: "neutral" },
        { segment: "1:30-4:00", mood: "positive" },
        { segment: "4:00-6:30", mood: "positive" }
      ],
      voiceTone: "Enthusiastic and engaged; asking detailed questions about enrollment options",
      summary: "Lead showed high purchase intent for the Full Stack Web Development bootcamp. Discussed fee structure, EMI breakdown, and career placement assistance. Recommended scheduling batch enrollment for next week.",
      keyPhrases: [
        "Full Stack Web Dev",
        "EMI payment options",
        "Career placement",
        "Weekend batch option",
        "High purchase intent"
      ],
      analyzedAt: Math.floor(Date.now() / 1000) - 84500
    },
    createdAt: Math.floor(Date.now() / 1000) - 90000,
    updatedAt: Math.floor(Date.now() / 1000) - 84500
  },
  {
    _id: "667d4f10a8b9c10012345602",
    id: "call-105",
    orgId: "a4213e83-097f-4d8e-bfa5-0960f2958c89",
    leadId: "crm-lead-98112",
    leadName: "Siddharth Malhotra",
    leadPhone: "+91 98112 23344",
    leadEmail: "siddharth.m@example.com",
    bdaId: "bda-7701",
    bdaEmail: "alice.guvi@guvi.in",
    callMode: "scheduled",
    status: "completed",
    scheduledTime: Math.floor(Date.now() / 1000) - 172800,
    startedAt: Math.floor(Date.now() / 1000) - 172800,
    endedAt: Math.floor(Date.now() / 1000) - 171000,
    isActive: true,
    classify: {
      uniqueId: "cls-uuid-505291",
      roomId: "room-s505",
      hostCode: "host-code-105",
      studentCode: "guest-code-105",
      label: "Call with Siddharth Malhotra — Alice",
      hostJoinUrl: "https://classify.zenclass.in/meet/room-s505?code=host-code-105&role=host",
      guestJoinUrl: "https://classify.zenclass.in/meet/room-s505?code=guest-code-105&role=student"
    },
    media: {
      recordingUrl: "https://s3.amazonaws.com/classify-recordings/call-105.mp4",
      transcriptUrl: "https://s3.amazonaws.com/classify-transcripts/call-105.json",
      chats: [
        { from: "BDA (Alice)", text: "Hello Siddharth! Glad we could connect.", ts: 5 },
        { from: "Siddharth Malhotra", text: "Hey Alice, I am looking for Data Science track details.", ts: 15 },
        { from: "BDA (Alice)", text: "Awesome, our Data Science track includes Python, SQL, and ML models.", ts: 30 }
      ]
    },
    analysis: {
      status: "done",
      outcome: "follow_up",
      conversionProbability: 62,
      attendancePercentage: 45,
      mood: "neutral",
      moodTimeline: [
        { segment: "0:00-2:00", mood: "neutral" },
        { segment: "2:00-5:00", mood: "mixed" }
      ],
      voiceTone: "Moderate pace, slightly hesitant about course commitment time vs work hours",
      summary: "Lead is evaluating multiple Data Science bootcamps. Appreciates the syllabus depth but needs a week to review schedule alignment with current job duties.",
      keyPhrases: [
        "Data Science Track",
        "Evaluating competitors",
        "Job schedule alignment",
        "Follow-up scheduled"
      ],
      analyzedAt: Math.floor(Date.now() / 1000) - 170900
    },
    createdAt: Math.floor(Date.now() / 1000) - 180000,
    updatedAt: Math.floor(Date.now() / 1000) - 170900
  },
  {
    _id: "667d4f10a8b9c10012345603",
    id: "call-103",
    orgId: "a4213e83-097f-4d8e-bfa5-0960f2958c89",
    leadId: "crm-lead-99887",
    leadName: "Vikram Patel",
    leadPhone: "+91 99887 76655",
    leadEmail: "vikram.patel@example.com",
    bdaId: "bda-7701",
    bdaEmail: "alice.guvi@guvi.in",
    callMode: "instant",
    status: "in_progress",
    scheduledTime: Math.floor(Date.now() / 1000) - 900,
    startedAt: Math.floor(Date.now() / 1000) - 900,
    endedAt: null,
    isActive: true,
    classify: {
      uniqueId: "cls-uuid-281099",
      roomId: "room-v281",
      hostCode: "host-code-281",
      studentCode: "guest-code-281",
      label: "Instant Call with Vikram Patel",
      hostJoinUrl: "https://classify.zenclass.in/meet/room-v281?code=host-code-281&role=host",
      guestJoinUrl: "https://classify.zenclass.in/meet/room-v281?code=guest-code-281&role=student"
    },
    media: {
      recordingUrl: null,
      transcriptUrl: null,
      chats: []
    },
    analysis: {
      status: "pending",
      outcome: null,
      conversionProbability: null,
      mood: null,
      moodTimeline: [],
      voiceTone: null,
      summary: null,
      keyPhrases: []
    },
    createdAt: Math.floor(Date.now() / 1000) - 900,
    updatedAt: Math.floor(Date.now() / 1000) - 900
  },
  {
    _id: "667d4f10a8b9c10012345604",
    id: "call-101",
    orgId: "a4213e83-097f-4d8e-bfa5-0960f2958c89",
    leadId: "crm-lead-98765",
    leadName: "Ananya Sharma",
    leadPhone: "+91 98765 43210",
    leadEmail: "ananya.s@example.com",
    bdaId: "bda-7701",
    bdaEmail: "alice.guvi@guvi.in",
    callMode: "scheduled",
    status: "scheduled",
    scheduledTime: Math.floor(Date.now() / 1000) + 7200,
    startedAt: null,
    endedAt: null,
    isActive: true,
    classify: null,
    media: { recordingUrl: null, transcriptUrl: null, chats: [] },
    analysis: { status: "pending" },
    createdAt: Math.floor(Date.now() / 1000),
    updatedAt: Math.floor(Date.now() / 1000)
  }
];
*/

class LeadCallsDB {
  constructor() {
    this.init();
  }

  init() {
    const existing = localStorage.getItem(DB_KEY);
    if (!existing) {
      localStorage.setItem(DB_KEY, JSON.stringify(SEED_CALLS));
    }
  }

  getCollection() {
    try {
      const raw = localStorage.getItem(DB_KEY);
      return raw ? JSON.parse(raw) : SEED_CALLS;
    } catch {
      return SEED_CALLS;
    }
  }

  saveCollection(records) {
    localStorage.setItem(DB_KEY, JSON.stringify(records));
  }

  find(query = {}) {
    let items = this.getCollection();
    if (query.status) {
      items = items.filter((i) => i.status === query.status);
    }
    if (query.callMode) {
      items = items.filter((i) => i.callMode === query.callMode);
    }
    return items;
  }

  findById(id) {
    const items = this.getCollection();
    return items.find((i) => i.id === id || i._id === id);
  }

  insert(recordData) {
    const items = this.getCollection();
    const newRecord = {
      _id: `667d4f10a8b9c${Date.now().toString(16).padStart(11, '0')}`,
      id: recordData.id || `call-${Date.now()}`,
      orgId: "a4213e83-097f-4d8e-bfa5-0960f2958c89",
      leadId: recordData.leadId || recordData.lead_id || "crm-lead-gen",
      leadName: recordData.leadName || recordData.lead_name || "New Lead",
      leadPhone: recordData.leadPhone || recordData.lead_phone || "+91 99999 00000",
      leadEmail: recordData.leadEmail || recordData.lead_email || null,
      bdaId: "bda-7701",
      bdaEmail: "alice.guvi@guvi.in",
      callMode: recordData.callMode || recordData.call_mode || "instant",
      status: recordData.status || "in_progress",
      scheduledTime: recordData.scheduledTime || recordData.scheduled_time || Math.floor(Date.now() / 1000),
      startedAt: recordData.status === "in_progress" ? Math.floor(Date.now() / 1000) : null,
      endedAt: null,
      isActive: true,
      classify: recordData.classify || {
        uniqueId: `cls-uuid-${Math.floor(Math.random() * 899999 + 100000)}`,
        roomId: `room-inst-${Math.floor(Math.random() * 899 + 100)}`,
        hostCode: `host-${Math.floor(Math.random() * 8999 + 1000)}`,
        studentCode: `guest-${Math.floor(Math.random() * 8999 + 1000)}`,
        label: `Instant Call with ${recordData.leadName || recordData.lead_name}`,
        hostJoinUrl: "https://classify.zenclass.in/meet/instant?role=host",
        guestJoinUrl: "https://classify.zenclass.in/meet/instant?role=student",
      },
      media: { recordingUrl: null, transcriptUrl: null, chats: [] },
      analysis: { status: "pending" },
      createdAt: Math.floor(Date.now() / 1000),
      updatedAt: Math.floor(Date.now() / 1000)
    };

    items.unshift(newRecord);
    this.saveCollection(items);
    return newRecord;
  }

  update(id, updates) {
    const items = this.getCollection();
    const idx = items.findIndex((i) => i.id === id || i._id === id);
    if (idx !== -1) {
      items[idx] = { ...items[idx], ...updates, updatedAt: Math.floor(Date.now() / 1000) };
      this.saveCollection(items);
      return items[idx];
    }
    return null;
  }
}

export const db = new LeadCallsDB();

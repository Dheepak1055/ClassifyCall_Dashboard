import axios from "axios";
import { db } from "./db.js";

// Helper to convert DB Mongo document format to CallRecord schema
function mapDbRecordToCall(rec) {
  return {
    id: rec.id,
    _id: rec._id,
    org_id: rec.orgId,
    lead_id: rec.leadId,
    lead_name: rec.leadName,
    lead_phone: rec.leadPhone,
    lead_email: rec.leadEmail,
    bda_id: rec.bdaId,
    bda_email: rec.bdaEmail,
    call_mode: rec.callMode,
    status: rec.status,
    scheduled_time: rec.scheduledTime,
    started_at: rec.startedAt,
    ended_at: rec.endedAt,
    recording_url: rec.media?.recordingUrl,
    transcript_url: rec.media?.transcriptUrl,
    chats: rec.media?.chats || [],
    classify: rec.classify
      ? {
          unique_id: rec.classify.uniqueId,
          room_id: rec.classify.roomId,
          label: rec.classify.label,
          thumbnail: rec.classify.thumbnail,
          host_join_url: rec.classify.hostJoinUrl,
          guest_join_url: rec.classify.guestJoinUrl,
          host_code: rec.classify.hostCode,
          student_code: rec.classify.studentCode,
        }
      : null,
    analysis: rec.analysis
      ? {
          status: rec.analysis.status,
          outcome: rec.analysis.outcome,
          conversion_probability: rec.analysis.conversionProbability,
          attendance_percentage: rec.analysis.attendancePercentage || 0,
          mood: rec.analysis.mood,
          mood_timeline: rec.analysis.moodTimeline || [],
          voice_tone: rec.analysis.voiceTone,
          summary: rec.analysis.summary,
          key_phrases: rec.analysis.keyPhrases || [],
          analyzed_at: rec.analysis.analyzedAt,
        }
      : { status: "pending" },
    raw_db_doc: rec // Provides direct access to raw DB document for DB Explorer
  };
}

export function setupMockApi() {
  axios.defaults.adapter = async (config) => {
    const url = config.url || "";
    const method = (config.method || "get").toLowerCase();

    // 1. GET /api/calls?status={tab}
    if (url.startsWith("/api/calls") && method === "get") {
      let status = "scheduled";
      if (config.params && config.params.status) {
        status = config.params.status;
      } else {
        const urlObj = new URL(url, "http://localhost:3000");
        status = urlObj.searchParams.get("status") || "scheduled";
      }

      const dbRecords = db.find({ status });
      const callsList = dbRecords.map(mapDbRecordToCall);

      await new Promise((r) => setTimeout(r, 150));

      return {
        data: callsList,
        status: 200,
        statusText: "OK",
        headers: {},
        config,
      };
    }

    // 2. GET /api/calls/db/all (Database Inspector Endpoint)
    if (url === "/api/calls/db/all" && method === "get") {
      const allDbRecords = db.getCollection();
      return {
        data: allDbRecords,
        status: 200,
        statusText: "OK",
        headers: {},
        config,
      };
    }

    // 3. POST /api/calls/instant
    if (url === "/api/calls/instant" && method === "post") {
      const body = typeof config.data === "string" ? JSON.parse(config.data) : config.data || {};
      const createdDbRec = db.insert({
        lead_id: body.lead_id,
        lead_name: body.lead_name,
        lead_phone: body.lead_phone,
        lead_email: body.lead_email,
        call_mode: "instant",
        status: "in_progress",
      });

      await new Promise((r) => setTimeout(r, 200));
      return {
        data: mapDbRecordToCall(createdDbRec),
        status: 201,
        statusText: "Created",
        headers: {},
        config,
      };
    }

    // 4. POST /api/calls/schedule
    if (url === "/api/calls/schedule" && method === "post") {
      const body = typeof config.data === "string" ? JSON.parse(config.data) : config.data || {};
      const createdDbRec = db.insert({
        lead_id: body.lead_id,
        lead_name: body.lead_name,
        lead_phone: body.lead_phone,
        lead_email: body.lead_email,
        scheduled_time: body.scheduled_time,
        call_mode: "scheduled",
        status: "scheduled",
        classify: null,
      });

      await new Promise((r) => setTimeout(r, 200));
      return {
        data: mapDbRecordToCall(createdDbRec),
        status: 201,
        statusText: "Created",
        headers: {},
        config,
      };
    }

    // 5. POST /api/calls/:id/start
    const startMatch = url.match(/\/api\/calls\/([^/]+)\/start/);
    if (startMatch && method === "post") {
      const callId = startMatch[1];
      const body = typeof config.data === "string" ? JSON.parse(config.data) : config.data || {};
      
      // Using real environment variables configured in the backend/build environment
      const authToken = import.meta.env.VITE_CLASSIFY_AUTH_TOKEN || "";
      const apiKey = import.meta.env.VITE_CLASSIFY_API_KEY || "";
      
      const callRecord = db.findById(callId);
      
      let classifyData = null;
      if (authToken && callRecord) {
        try {
          const res = await window.fetch("/api/classify/createInstantMeet", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization-key": apiKey || "test-key"
            },
            body: JSON.stringify({
              authToken: authToken,
              product: "guvi",
              label: "Demo Instant Meet",
              meetingType: "instant",
              org_id: "optional-org-id",
              hosts: [
                {
                  name: "Alice",
                  email: "alice@example.com"
                }
              ],
              autoRecordingStart: "off",
              studentHMSRole: "student",
              created_by: "admin"
            })
          });
          
          if (!res.ok) {
            console.error("Classify API error:", await res.text());
          } else {
            const responseData = await res.json();
            if (responseData.access && responseData.details) {
               const d = responseData.details;
               classifyData = {
                 uniqueId: d.uniqueId,
                 roomId: d.roomId,
                 hostCode: d.hostCode,
                 studentCode: d.studentCode,
                 label: d.label,
                 hostJoinUrl: `https://classify.zenclass.in/meet/${d.roomId}?code=${d.hostCode}&role=host`,
                 guestJoinUrl: `https://classify.zenclass.in/meet/${d.roomId}?code=${d.studentCode}&role=student`
               };
            }
          }
        } catch (err) {
          console.error("Failed to hit real Classify API:", err);
        }
      }
      
      if (!classifyData) {
        classifyData = {
          uniqueId: `cls-uuid-${Date.now()}`,
          roomId: `room-${callId}`,
          hostCode: `host-${callId}`,
          studentCode: `guest-${callId}`,
          label: `Live Meeting ${callId}`,
          hostJoinUrl: `https://classify.zenclass.in/meet/room-${callId}?code=host-${callId}&role=host`,
          guestJoinUrl: `https://classify.zenclass.in/meet/room-${callId}?code=guest-${callId}&role=student`,
        };
      }

      const updatedDbRec = db.update(callId, {
        status: "in_progress",
        startedAt: Math.floor(Date.now() / 1000),
        classify: classifyData,
        analysis: { status: "pending" }
      });

      return {
        data: updatedDbRec ? mapDbRecordToCall(updatedDbRec) : { success: true },
        status: 200,
        statusText: "OK",
        headers: {},
        config,
      };
    }

    // 6. POST /api/calls/:id/end
    const endMatch = url.match(/\/api\/calls\/([^/]+)\/end/);
    if (endMatch && method === "post") {
      const callId = endMatch[1];
      
      const callRecord = db.findById(callId);
      if (callRecord) {
        db.update(callId, {
          status: "completed",
          endedAt: Math.floor(Date.now() / 1000),
          analysis: {
            status: "done",
            outcome: "interested",
            conversionProbability: Math.floor(Math.random() * 40) + 50, // Mock 50-90
            attendancePercentage: Math.floor(Math.random() * 20) + 80, // Mock 80-100
            mood: "positive",
            moodTimeline: [
              { segment: "0:00-1:00", mood: "neutral" },
              { segment: "1:00-3:00", mood: "positive" }
            ],
            voiceTone: "Engaged and positive.",
            summary: "Simulated Call Completion for backend requirement testing. The lead was very positive about the product and attended most of the session.",
            keyPhrases: ["Good", "Backend Test", "Interested"],
            analyzedAt: Math.floor(Date.now() / 1000)
          },
          media: {
            recordingUrl: "https://s3.amazonaws.com/mock-classify/rec-" + callId + ".mp4",
            transcriptUrl: "https://s3.amazonaws.com/mock-classify/transcript-" + callId + ".json",
            chats: [
              { from: "BDA", text: "Testing backend completion.", ts: 10 },
              { from: callRecord.leadName || "Lead", text: "Looks good!", ts: 20 }
            ]
          }
        });
      }

      await new Promise((r) => setTimeout(r, 400));
      return {
        data: { success: true },
        status: 200,
        statusText: "OK",
        headers: {},
        config,
      };
    }

    return {
      data: [],
      status: 200,
      statusText: "OK",
      headers: {},
      config,
    };
  };
}

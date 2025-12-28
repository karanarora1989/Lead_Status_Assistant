import React, { useState, useEffect, useRef } from 'react';
import { Send, User, Settings, X } from 'lucide-react';

const LeadTrackerApp = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showLeadSuggestions, setShowLeadSuggestions] = useState(false);
  const [leadSuggestions, setLeadSuggestions] = useState([]);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(0);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const [currentLeadContext, setCurrentLeadContext] = useState(null);

  // Reminder management
  const getReminders = () => {
    try {
      const stored = localStorage.getItem('salesCentral_reminders');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error reading reminders:', error);
      return [];
    }
  };

  const saveReminders = (reminders) => {
    try {
      localStorage.setItem('salesCentral_reminders', JSON.stringify(reminders));
    } catch (error) {
      console.error('Error saving reminders:', error);
    }
  };

  const cleanOldReminders = () => {
    const reminders = getReminders();
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    
    const cleaned = reminders.filter(reminder => {
      const dueDate = new Date(reminder.dueDate);
      return dueDate >= threeDaysAgo;
    });
    
    if (cleaned.length !== reminders.length) {
      saveReminders(cleaned);
    }
  };

  const addReminder = (reminder) => {
    const reminders = getReminders();
    reminders.push({
      ...reminder,
      id: `rem_${Date.now()}`,
      createdDate: new Date().toISOString().split('T')[0]
    });
    saveReminders(reminders);
  };

  const getRemindersForDate = (dateString) => {
    const reminders = getReminders();
    return reminders.filter(r => r.dueDate === dateString);
  };

  const defaultPrompt = `You are a helpful, empathetic lead management assistant for Relationship Managers (RMs) in the lending industry.

PERSONALITY:
- Warm and conversational like a helpful colleague
- Empathetic but action-oriented
- Concise and practical - avoid fluff
- DISBURSAL-FOCUSED: RMs earn on disbursals, so prioritize actions that move leads toward disbursal
- ALWAYS neutral and supportive in tone - never negative or accusatory
- FACT-BASED: Only use information from the system - never fabricate or assume

CRITICAL RESPONSE RULES:
1. BREVITY: Keep responses 50% shorter than you normally would. Be concise.
2. NO REPETITION: Skip intro/status recap - user already knows basic info from their system
3. NATURAL FLOW: Never use headers like "What needs your attention" or "Action Required"
4. BLENDED ACTIONS: Weave what needs attention directly into the action steps conversationally
5. GET TO THE POINT: Start directly with what matters most
6. DISBURSAL URGENCY: Frame actions in terms of getting to disbursal faster
7. NEUTRAL TONE: Frame as opportunities, not failures or delays
8. NO FABRICATION: ONLY use information explicitly provided in the lead data - NEVER assume, infer, or make up details

DISBURSAL OPTIMIZATION (Critical):
- RMs make money ONLY on disbursals, not sanctions or applications
- Stages are in chronological order: Received → Drafts → CPA/Login → Credit → Verifications → Sanctioned → LD Pending → BOM/BOC → COA → Disbursed
- Later stages (COA, BOC, BOM, Query from Ops, LD Pending, Sanctioned) are CLOSEST to disbursal - these are TOP PRIORITY
- When showing "what to focus on", rank by: (1) Latest stage + action needed, (2) Blocked/queries at any stage, (3) Early stage leads
- Emphasize SPEED: "Get this disbursed this week" over "process normally"
- Flag disbursal risks: rejections, commercial deviations, long delays
- Celebrate near-wins: "This one's almost there - just needs X to disburse"

PRIORITY FRAMEWORK FOR FOCUS:
1. HIGHEST PRIORITY (Extremely close to money - DAYS away from disbursal):
   - COA (payment processing - about to disburse!)
   - BOC Verification (final verification - days from disbursal)
   - BOM Verification (final verification - days from disbursal)
   - Query from Ops (small fix = immediate disbursal)
   - LD Pending (customer signature = disbursal in days)

2. HIGH PRIORITY (Close to money - WEEKS away from disbursal):
   - Sanctioned (need acceptance = quick path to LD Pending then disbursal)
   - Commercial Deviation (convince customer = secure disbursal)

3. MEDIUM PRIORITY (Mid-stage - blocked or need follow-up):
   - Query from Credit (resolve = back on track to disbursal)
   - Final Appraisal, FCU (almost at sanction - follow up to expedite)
   - Parallel Verifications with ONE blocked (unblock it = case moves forward)
   - Rejected but re-sanction possible (fix issues = potential disbursal)

4. LOWER PRIORITY (Early stage - MONTHS from disbursal):
   - Parallel Verifications all on-track (monitor only - no action needed)
   - Individual Verifications (PD/Legal/Technical/FI) - with other teams, on-track (monitor only)
   - Credit Appraisal - underwriting in progress (monitor only)
   - CPA/Login - file checking (monitor only)
   - Drafts, Received (important but far from disbursal - will take time)

REMINDERS SYSTEM (Critical):
RMs get verbal commitments from customers and internal teams that aren't recorded in Sales Central. Help track these off-system commitments.

SETTING REMINDERS:
When RM says things like:
- "Remind me to follow up with Sneha tomorrow on the salary slips"
- "Set reminder for Friday - check with Credit Manager on L004"
- "Priya said she'll sign by Dec 30th, remind me"

Parse and extract:
1. Lead ID (from context or explicit mention)
2. Actor name (customer or internal person/team)
3. Actor phone (from lead data)
4. Commitment (what they promised to do)
5. Due date (parse natural language - see DATES below)

Respond with confirmation: "Got it! I'll remind you tomorrow to follow up with Sneha (L004) on the salary slips."

Then on a new line add: REMINDER_SET: {"leadId":"L004","actor":"Sneha Reddy","actorPhone":"+91 98765 43213","commitment":"Send salary slips","dueDate":"2025-12-29"}

DATES PARSING:
- "tomorrow" → next day (today + 1)
- "Friday" → next Friday
- "in 3 days" → today + 3
- "next week" → today + 7
- "Dec 30" → specific date
- Always use YYYY-MM-DD format

SHOWING REMINDERS:
When RM asks "focus today", "what should I focus on", "reminders for today", "reminders for tomorrow":
- Check if there are reminders for the requested date (today or tomorrow)
- Show reminders FIRST with 🔔 icon before action-needed leads
- Format: "🔔 2 follow-ups for today:\n- L004 - Sneha: Follow up on salary slips (she committed yesterday)\n\nACTION: [call|📞 Call Sneha|+91 98765 43213]"
- Then show regular action-needed leads

REMINDER RULES:
- Only show reminders when RM explicitly asks (focus/reminders queries)
- NEVER show overdue/past reminders (only today or tomorrow based on query)
- Only include call action button for reminders (no snooze, no mark done)
- Keep reminder text concise - just actor, commitment, and when they committed

ESCALATION & CONTACT PATHS (Critical):
When leads are with other teams and need follow-up:
- PD stage: "Connect with Credit Manager [name] at [phone] to expedite with the PD agency"
- FI-Resi/FI-Office stage: "Connect with Credit Manager [name] at [phone] to expedite with the FI agency"
- Legal stage: "Connect with Legal Manager [name] at [phone] directly to expedite"
- Technical stage: "Connect with Technical Manager [name] at [phone] directly to expedite"
- FCU stage: "It's with FCU team for fraud checks - connect with FCU Manager [name] at [phone] directly to expedite"
- Credit Appraisal stage: "Connect with the Credit Team member [name] at [phone] to check status"
- BOM/BOC/Ops: "Connect with [team] manager directly" (use contact from lead data)

NEVER say "follow up with the team" - always provide SPECIFIC contact person and phone number from lead data.

PARALLEL VERIFICATIONS (Critical):
Multiple verifications (FI + FCU, or Legal + Technical + PD) can run simultaneously. When discussing parallel verifications:
- PRIORITIZE what needs RM action - mention blocked verifications FIRST
- For verifications in progress without issues: briefly acknowledge they're ongoing
- Example: "FI-Resi is blocked - customer needs to coordinate with neighbors for verification. FI-Office and FCU are moving along fine."
- Focus on UNBLOCKING the stuck verification to keep the case moving
- If one verification is complete: celebrate it briefly, then focus on pending ones
- NEVER say "all verifications are pending" - be specific about which ones and their individual status
- Format: "Legal needs [action] - been 5 days. Technical and PD are on track, no action needed from you there."

POST-VERIFICATION REJECTIONS (Critical):
When credit team rejects after verifications (especially PD/FI issues):
- State the rejection reason from lead data clearly and factually
- Distinguish between HARD rejection (PD fraud/address mismatch - unlikely to reverse) vs SOFT rejection (income/employment concerns - can re-submit with more docs)
- For HARD rejections: "This is a tough one to reverse - PD found serious issues. You can escalate to Credit Manager but chances are low."
- For SOFT rejections: Frame re-sanction steps positively: "You can get this approved with [specific docs]. Here's what you need..."
- NEVER blame the customer - stay neutral: "Credit team wasn't comfortable with the PD findings" NOT "Customer lied about address"
- Include escalation contact for RM to discuss with credit team

REMINDERS (Critical):
RMs get verbal commitments from customers/internal teams that aren't recorded in Sales Central. You help track these.

SETTING REMINDERS:
When RM says things like:
- "Remind me to follow up with Sneha tomorrow on the docs"
- "Set reminder for Friday to check with Credit Manager"
- "Priya said she'll sign by Dec 30, remind me"

YOU MUST:
1. Parse the request to extract:
   - Lead ID (from context or mention)
   - Actor name (customer or internal person)
   - Actor phone (from lead data)
   - Commitment (what they promised)
   - Due date (parse: tomorrow, Friday, in 3 days, Dec 30, next week)

2. Respond with simple confirmation text:
   "Got it! I'll remind you [tomorrow/Friday/Dec 30] to follow up with [Actor] on [commitment]."

3. Add this EXACT line at the end of your response (AI will parse and store it):
   REMINDER_SET: {"leadId":"L004","actor":"Sneha Reddy","actorPhone":"+91 98765 43213","commitment":"Send salary slips","dueDate":"2025-12-29"}

DATE PARSING FOR REMINDERS:
- "tomorrow" → next day
- "Friday" → next occurring Friday
- "in 3 days" → 3 days from now
- "Dec 30" or "30th Dec" → that specific date (assume current year unless specified)
- "next week" → 7 days from now
Use YYYY-MM-DD format for dueDate

SHOWING REMINDERS:
When RM asks "What should I focus on today?" or "Any reminders for today?" or "reminders for tomorrow?":
- You'll receive REMINDERS FOR TODAY/TOMORROW in the context
- Show reminders FIRST with 🔔 emoji before action-needed leads
- Format: "🔔 2 follow-ups for today:"
- For each reminder: "- [Lead ID] - [Actor]: [Commitment] (committed [when])"
- Include ONLY call action button for each reminder: ACTION: [call|📞 Call [Actor]|[phone]]
- After reminders, show regular action-needed leads

REMINDER DISPLAY EXAMPLE:
"🔔 2 follow-ups for today:
- L004 - Sneha Reddy: Follow up on salary slips (she committed yesterday)

ACTION: [call|📞 Call Sneha|+91 98765 43213]

- L011 - FCU Manager: Check fraud check status (Rajesh said would complete by today)

ACTION: [call|📞 Call FCU Manager|+91 98765 44004]

⚡ 3 leads need your action:
- L013 - Sanjay is sanctioned..."

IMPORTANT REMINDER RULES:
- Only show reminders when RM explicitly asks (focus/reminders query)
- Never show overdue/past reminders - only for requested day (today/tomorrow)
- No snooze or mark done buttons - just call button
- Keep confirmation text simple - no elaborate explanations

TAT & FOLLOW-UP RULES:
- NEVER EVER mention estimated TAT or "expected timeline" or "should take X days" or "estimated time" or "normally takes" or "usually X days"
- You DON'T KNOW what normal timelines are for any stage - NEVER pretend you do
- ONLY state FACTS from the data: "has been with credit team for 4 days" is GOOD
- "should take 5-7 days" or "normally takes 3 days" or "expected in 2 days" is STRICTLY FORBIDDEN - never estimate
- IF a lead has been with another team/person for more than 1 day: Tell RM to follow up with them to expedite
- Example: "It's been with Ramesh for 3 days now - give him a call to check status and nudge it along"
- Include these follow-up cases in "what should I focus on" queries alongside direct actions
- Frame follow-ups as protecting disbursal: "Don't let this sit and lose the disbursal"
- For parallel verifications: State days for EACH verification separately
- Example: "FI-Office has been ongoing for 2 days and Legal just got initiated yesterday" - this is GOOD
- NEVER compare to expected timelines since you don't know them

RESPONSE FORMATTING:
- When showing pipeline or focus lists, ALWAYS include lead ID with customer name
- Format: "L001 - Rajesh Kumar" or "Rajesh Kumar (L001)" - be consistent
- This helps RM quickly reference leads in the system
- For focus lists, mention proximity to disbursal: "Almost there", "Close to closing", "Needs push"
- When providing contact info: Use mobile numbers only, NEVER extension numbers
- Format contacts as: "Call Suresh Kumar at +91 98765 43299" NOT "ext: 4523"

STAGE TRANSLATION (Never say stage names directly - blend into conversation):
- "Received" = "Just allocated to you" / "Fresh lead in your bucket"
- "Drafts" = "You haven't submitted this yet" / "Still in your bucket"
- "CPA/Login" = "File checker team is reviewing" / "Login desk has it"
- "Query from Credit" = "Credit team is waiting on you" / "They need clarification"
- "Credit Appraisal" = "Credit team is evaluating" / "They're underwriting"
- "PD/Legal/Technical/FI-Resi/FI-Office/FCU" = "Verification in progress" / "They're doing [specific] verification"
- "PD" = "PD agency is doing physical documentation verification" / "Connect with Credit Manager if needed to expedite"
- "FI-Resi" = "FI agency is doing residence verification" / "Connect with Credit Manager if needed to expedite"
- "FI-Office" = "FI agency is doing office/employment verification" / "Connect with Credit Manager if needed to expedite"
- "Legal" = "Legal team is doing property title verification" / "Connect with Legal Manager directly to expedite"
- "Technical" = "Technical team is doing property valuation" / "Connect with Technical Manager directly to expedite"
- "FCU" = "FCU team is doing fraud checks and final credit review" / "Connect with FCU Manager directly to expedite"
- "Final Appraisal" = "Final credit review happening" / "Almost there, final checks"
- "Parallel Verifications" = "Multiple verifications running together" / "[List specific ones] are in progress"
- "Sanctioned" = "Approved! You need to get customer acceptance to move forward" / "Get customer to accept the sanction to proceed"
- "Rejected" = "Not approved" / "Declined - potential loss"
- "Commercial Deviation" = "Customer wants more than approved - you need to negotiate and get their decision" / "Get customer to accept revised amount to disburse"
- "LD Pending" = "You need to get customer signatures on loan docs to proceed for disbursal" / "Get the loan agreement signed to disburse"
- "BOM Verification" = "BOM team is verifying - final steps before disbursal"
- "Query from Ops" = "Ops team needs something from you - small fix to disburse"
- "BOC Verification" = "BOC team is verifying - almost at disbursal"
- "COA" = "Payment processing to customer - about to disburse!"
- "Disbursed" = "Done! Money sent to customer - you earned on this"

RM-FOCUSED LANGUAGE (Critical):
- Say "It's been with you for X days" NOT "Customer has been waiting"
- Say "You need to collect docs" NOT "Pending documents from customer"
- Say "You need to get customer signatures" NOT "Customer needs to sign" or "Waiting for customer to sign"
- Say "You need to get their acceptance" NOT "Customer needs to accept" or "Waiting on customer"
- Say "You can submit within X days" NOT "Case should move forward"
- Say "Credit team raised a query 3 days ago" NOT "Sneha has been waiting on you for 3 days"
- Say "You need to collect updated salary slips" NOT "Credit team needs salary slips"
- Focus on RM's actions, RM's timelines, RM's responsibilities
- Make it about what's in RM's control
- Connect actions to disbursal: "Get this done today and you're 2 days from disbursal"
- TONE: Keep it neutral and supportive, never accusatory or negative
- Say "This has been with you for 2 days" NOT "Sitting on this for 2 days"
- Say "You can move this forward" NOT "You haven't done this yet"
- Frame as opportunities, not failures: "Quick action here gets you closer to disbursal"

ADDITIONAL RM-FOCUSED EXAMPLES:
❌ BAD: "Sneha Reddy has been waiting on you for 3 days. Credit team needs updated salary slips."
✅ GOOD: "Query from Credit team 3 days ago - you need updated salary slips (last 3 months with breakdown)."

❌ BAD: "Customer is waiting for you to submit the application."
✅ GOOD: "This has been with you for 2 days - you can submit once you have the pending docs."

❌ BAD: "Rahul needs to accept the sanction letter."
✅ GOOD: "You need to get Rahul to accept the sanction letter."

❌ BAD: "Pending customer signature on loan documents."
✅ GOOD: "You need to get customer signatures on the loan documents to proceed for disbursal."

❌ BAD: "Case has been delayed because documents are pending."
✅ GOOD: "You need to collect 3 documents to move this forward."

❌ BAD: "Priya hasn't sent the bank statements yet."
✅ GOOD: "You need to collect bank statements from Priya."

NATURAL ACTION FLOW (Examples):
❌ Bad: "**What needs your attention:** You need to collect documents. **Action plan:** Call customer and get XYZ."
✅ Good: "You need to collect 3 documents and fill the employment section. Call Rajesh, get the docs via WhatsApp, complete the form, then submit."

❌ Bad: "**Status:** Pending. **Action Required:** Follow up with credit team."
✅ Good: "Credit team raised a query 2 days ago. Get the salary slips from Priya and upload them today to keep this moving."

❌ Bad: "Sneha Reddy has been waiting on you for 3 days. Credit team needs updated salary slips."
✅ Good: "Query from Credit team 3 days ago - you need updated salary slips (last 3 months with breakdown). Call Sneha, get them via WhatsApp, upload in Sales Central to resolve and move forward."

❌ Bad: "Expected timeline is 5-7 days for decision."
✅ Good: "Been with the credit team for 4 days - give them a call to check if they need anything from you."

❌ Bad: "Should be done in 2-3 days normally."
✅ Good: "Been with Legal team for 3 days now."

❌ Bad: "This usually takes 1 week."
✅ Good: "Has been in FCU for 2 days."

❌ Bad: "Rajesh Kumar needs documents" (no lead ID)
✅ Good: "L001 - Rajesh Kumar needs 3 documents from you"

❌ Bad: "Work on Drafts leads" (no disbursal context)
✅ Good: "L013 - Sanjay is sanctioned - get his acceptance today and you'll disburse this week. That's your fastest win."

❌ Bad: "Contact Credit Manager (ext: 4523)"
✅ Good: "Call Deepak Joshi at +91 98765 44001"

❌ Bad: "This has been sitting with you for 3 days" (negative tone)
✅ Good: "This has been with you for 3 days - you can action it now to move forward"

❌ Bad: "You haven't submitted this yet" (accusatory)
✅ Good: "You can submit this once you have the pending docs"

❌ Bad: "What direction do you think Rahul will lean toward?" (asking RM to predict)
✅ Good: "Want me to draft talking points for your call with Rahul?"

❌ Bad: "Is this his first loan with us?" (asking for system data)
✅ Good: "Should we prioritize this one over the others?"

❌ Bad: "Customer sent the docs yesterday" (fabricating timeline)
✅ Good: "Once you get the docs from the customer, you can submit"

❌ Bad: "They usually respond quickly" (assuming behavior)
✅ Good: "Call them to request the pending docs"

❌ Bad: "Customer is waiting for you to call them back"
✅ Good: "You need to call them to collect the pending information"

❌ Bad: "Pending customer action on acceptance"
✅ Good: "You need to get customer to accept the sanction"

CONVERSATION STYLE:
- Use first names for customers naturally
- Acknowledge difficulty when relevant
- Be specific and actionable
- Include brief phone scripts only when asked
- One "pro tip" maximum per response
- NO section headers or formal structures
- Remind about disbursal opportunity when relevant
- TONE: Always neutral and supportive, never negative or accusatory
- Avoid phrases like: "sitting on", "haven't done", "delayed", "behind", "neglected"
- Use instead: "been with you", "ready to move forward", "opportunity to progress", "can action this"
- Frame everything as forward-looking opportunities, not backward-looking failures
- NEVER ask RM to predict future behavior or outcomes
- NEVER ask RM for facts that are in the system/lead data

STRUCTURE:
- Start with the action needed (naturally woven in)
- Add brief how-to steps if helpful
- End with one follow-up question
- Keep formatting minimal (avoid bold headers)
- For "focus" queries: Lead with near-disbursal opportunities

QUESTION GUIDELINES (Critical):
- NEVER ask RM to predict customer behavior or decisions ("What do you think Rahul will do?", "Which way will customer lean?")
- NEVER ask RM for information that's in the system ("Is this their first loan?", "What's the CIBIL score?", "How much did they apply for?")
- Ask ONLY about: (1) Actions RM wants to take next, (2) Preferences on approach, (3) Clarifications on RM's own plans
- Good questions: "Want me to draft a message for them?", "Should we focus on this lead first?", "Need the step-by-step for this?"
- Bad questions: "Do you think they'll accept?", "Is this a repeat customer?", "What's their income?"

FABRICATION RULES (Critical - Never Violate):
- ONLY use information explicitly stated in the lead data JSON
- NEVER assume timelines, events, or details not in the data
- If information isn't in the data, DON'T mention it
- NEVER EVER fabricate numbers, percentages, or amounts not in the data
- NEVER link loan amounts to commission/earnings amounts - you don't know RM's commission structure
- NEVER mention progress percentages unless they are EXACTLY in the lead data
- NEVER make up "82% complete", "90% there" etc. unless that exact number is in the data
- NEVER predict if something is "on track", "on schedule", "moving well", "delayed", "taking too long" - you don't know expected timelines
- NEVER say "normally takes X days" or "usually done in X days" or "expected to complete in X days" - you DON'T KNOW normal timelines
- The "status" field in lead data (on-track, action-needed, delayed) is SYSTEM-GENERATED - you can use ONLY if present in data, never infer it
- ONLY state facts: "Been with credit team for 4 days" is GOOD. "Moving on schedule" or "Taking longer than usual" is BAD.
- Just state: "Has been with [person/team] for [X days] for [task]" - no assessment of whether that's good or bad or fast or slow
- Examples of fabrication to AVOID:
  * "Customer sent docs yesterday" (unless explicitly stated)
  * "They usually respond quickly" (unless in data)
  * "Last time they did X" (unless in history)
  * "Customer mentioned they prefer Y" (unless documented)
  * "You'll earn ₹30 lacs commission" (NEVER mention commission amounts)
  * "This is at 82%" (unless progress: 82 is in the data)
  * "That's ₹5000 in your pocket" (NEVER fabricate earning amounts)
  * "It's moving on schedule" (unless status field explicitly says on-track)
  * "Just 1 day so it's fine" (NEVER assess if timeline is appropriate)
  * "Taking too long" or "Delayed" (unless status field says delayed)
  * "Should be done soon" or "Will complete in 2 days" (NEVER predict completion)
- If you need to reference actions: Use neutral language like "Once you collect docs" NOT "After customer sends docs tomorrow"
- For disbursals: Say "Nice work!" or "You earned on this" but NEVER fabricate specific earning amounts
- For parallel verifications: State days in stage for EACH verification separately from the data

ACTION BUTTONS - CRITICAL - YOU MUST DO THIS:
When discussing a specific lead, you MUST ALWAYS suggest 2-4 action buttons at the VERY END of your response.
THIS IS MANDATORY - DO NOT SKIP THIS STEP.

Format EXACTLY (copy this format exactly):
ACTION: [type|label|data]

Each ACTION must be on its own line at the END of your response.

Types:
- call: ACTION: [call|📞 Call {FirstName}|{phone_number_from_data}]
- draft: ACTION: [draft|📝 Draft {Type}|{context_key}]
- confirm: ACTION: [confirm|✓ Mark {Action}|{type}]
- nudge: ACTION: [nudge|→ {Action} in Sales Central|{type}]

App CTA Language (RM-focused, direct commands):
✅ "Submit in Sales Central" NOT "Go Submit"
✅ "Upload in Sales Central" NOT "Nudge Upload"
✅ "Complete in Sales Central" NOT "Help Complete"
✅ "Resolve Query in Sales Central" NOT "Help Resolve"

Draft contexts: doc_request, query_response, sanction_script, negotiation, followup, intro, resanction
Confirm types: docs_received, customer_accepted, decision_received, docs_signed
Nudge types: resolve_query, start_application, submit_application, upload_docs, complete_application

EXAMPLE - This is what your response should look like for Drafts stage:
"L002 - Priya needs 3 documents from you. Call her at +91 98765 43211, get them via WhatsApp, then submit in Sales Central.

ACTION: [call|📞 Call Priya|+91 98765 43211]
ACTION: [draft|📝 Draft Document Request|doc_request]
ACTION: [confirm|✓ Mark Docs Received|docs_received]
ACTION: [nudge|→ Submit in Sales Central|submit_application]"

DISBURSAL CELEBRATIONS: 
When discussing Disbursed lead: "🎉 {Name}'s loan of {Amount} disbursed today! Nice work! 💰"
Example: "🎉 Tarun Mehta's loan of ₹19 lacs disbursed today! Nice work! 💰"

Remember: RMs are busy. Respect their time. Make every word count. Sound like a colleague, not a report. Help them close deals and earn money through disbursals. Always stay neutral and supportive - you're here to help, not judge. Stick to facts from the system only. ALWAYS INCLUDE ACTION BUTTONS FOR SPECIFIC LEADS.`;
  
  const [systemPrompt, setSystemPrompt] = useState(defaultPrompt);

  // Lead data covering all stages
  const leadsData = {
    'L001': {
      id: 'L001',
      name: 'Rajesh Kumar',
      amount: '₹25,00,000',
      stage: 'Received',
      progress: 10,
      status: 'on-track',
      daysInStage: 0,
      phone: '+91 98765 43210',
      productType: 'Home Loan',
      actionRequired: true,
      actionOwner: 'RM',
      notes: 'Fresh lead just allocated'
    },
    'L002': {
      id: 'L002',
      name: 'Priya Sharma',
      amount: '₹15,00,000',
      stage: 'Drafts',
      progress: 35,
      status: 'on-track',
      daysInStage: 2,
      phone: '+91 98765 43211',
      pendingDocs: ['Income Proof', 'Bank Statements (6 months)', 'Property Documents'],
      completedDocs: ['PAN Card', 'Aadhaar Card'],
      pendingModules: ['Employment Details', 'Co-applicant Info'],
      productType: 'Personal Loan',
      actionRequired: true,
      actionOwner: 'RM'
    },
    'L003': {
      id: 'L003',
      name: 'Amit Patel',
      amount: '₹40,00,000',
      stage: 'CPA/Login',
      progress: 40,
      status: 'on-track',
      daysInStage: 1,
      phone: '+91 98765 43212',
      currentOwner: 'Login Desk - Kavita Mehta',
      productType: 'Loan Against Property',
      actionRequired: false,
      actionOwner: 'Login Desk'
    },
    'L004': {
      id: 'L004',
      name: 'Sneha Reddy',
      amount: '₹8,00,000',
      stage: 'Query from Credit',
      progress: 50,
      status: 'action-needed',
      daysInStage: 3,
      phone: '+91 98765 43213',
      queryType: 'Income Verification',
      queryDetails: 'Need updated salary slips for last 3 months with complete breakdown',
      queryRaisedBy: 'Credit Team - Suresh Kumar',
      productType: 'Personal Loan',
      actionRequired: true,
      actionOwner: 'RM'
    },
    'L005': {
      id: 'L005',
      name: 'Vikram Singh',
      amount: '₹12,00,000',
      stage: 'Credit Appraisal',
      progress: 55,
      status: 'on-track',
      daysInStage: 4,
      phone: '+91 98765 43214',
      currentOwner: 'Credit Team - Ramesh Iyer',
      escalationContact: 'Credit Team - Ramesh Iyer',
      escalationPhone: '+91 98765 44008',
      productType: 'Business Loan',
      actionRequired: false,
      actionOwner: 'Credit Team'
    },
    'L006': {
      id: 'L006',
      name: 'Ananya Iyer',
      amount: '₹20,00,000',
      stage: 'PD',
      progress: 60,
      status: 'on-track',
      daysInStage: 2,
      phone: '+91 98765 43215',
      currentOwner: 'PD Agency - Veritas Services',
      escalationContact: 'Credit Manager - Deepak Joshi',
      escalationPhone: '+91 98765 44001',
      verificationType: 'Physical Documentation',
      productType: 'Home Loan',
      actionRequired: false,
      actionOwner: 'PD Team'
    },
    'L007': {
      id: 'L007',
      name: 'Karan Malhotra',
      amount: '₹35,00,000',
      stage: 'Legal',
      progress: 62,
      status: 'on-track',
      daysInStage: 3,
      phone: '+91 98765 43216',
      currentOwner: 'Legal Team - Advocate Sharma',
      escalationContact: 'Legal Manager - Pradeep Singh',
      escalationPhone: '+91 98765 44002',
      verificationType: 'Property Title Verification',
      productType: 'Home Loan',
      actionRequired: false,
      actionOwner: 'Legal Team'
    },
    'L008': {
      id: 'L008',
      name: 'Meera Nair',
      amount: '₹18,00,000',
      stage: 'Technical',
      progress: 64,
      status: 'on-track',
      daysInStage: 2,
      phone: '+91 98765 43217',
      currentOwner: 'Technical Team - Ravi Kumar',
      escalationContact: 'Technical Manager - Anil Verma',
      escalationPhone: '+91 98765 44003',
      verificationType: 'Property Valuation',
      productType: 'Loan Against Property',
      actionRequired: false,
      actionOwner: 'Technical Team'
    },
    'L009': {
      id: 'L009',
      name: 'Rohan Gupta',
      amount: '₹22,00,000',
      stage: 'FI-Resi',
      progress: 66,
      status: 'on-track',
      daysInStage: 1,
      phone: '+91 98765 43218',
      currentOwner: 'FI Agency - QuickVerify',
      escalationContact: 'Credit Manager - Deepak Joshi',
      escalationPhone: '+91 98765 44001',
      verificationType: 'Residence Verification',
      productType: 'Home Loan',
      actionRequired: false,
      actionOwner: 'FI Team'
    },
    'L010': {
      id: 'L010',
      name: 'Divya Kapoor',
      amount: '₹10,00,000',
      stage: 'FI-Office',
      progress: 68,
      status: 'on-track',
      daysInStage: 1,
      phone: '+91 98765 43219',
      currentOwner: 'FI Agency - QuickVerify',
      escalationContact: 'Credit Manager - Deepak Joshi',
      escalationPhone: '+91 98765 44001',
      verificationType: 'Office/Employment Verification',
      productType: 'Personal Loan',
      actionRequired: false,
      actionOwner: 'FI Team'
    },
    'L011': {
      id: 'L011',
      name: 'Arjun Desai',
      amount: '₹28,00,000',
      stage: 'FCU',
      progress: 70,
      status: 'on-track',
      daysInStage: 2,
      phone: '+91 98765 43220',
      currentOwner: 'FCU Team - Final Credit Review',
      escalationContact: 'FCU Manager - Rajesh Nambiar',
      escalationPhone: '+91 98765 44004',
      productType: 'Home Loan',
      actionRequired: false,
      actionOwner: 'Credit Team'
    },
    'L012': {
      id: 'L012',
      name: 'Pooja Agarwal',
      amount: '₹16,00,000',
      stage: 'Final Appraisal',
      progress: 75,
      status: 'on-track',
      daysInStage: 2,
      phone: '+91 98765 43221',
      currentOwner: 'Credit Manager - Deepak Joshi',
      productType: 'Personal Loan',
      actionRequired: false,
      actionOwner: 'Credit Team'
    },
    'L013': {
      id: 'L013',
      name: 'Sanjay Verma',
      amount: '₹30,00,000',
      stage: 'Sanctioned',
      progress: 80,
      status: 'on-track',
      daysInStage: 1,
      phone: '+91 98765 43222',
      sanctionedAmount: '₹30,00,000',
      productType: 'Home Loan',
      actionRequired: true,
      actionOwner: 'RM'
    },
    'L014': {
      id: 'L014',
      name: 'Neha Saxena',
      amount: '₹0',
      appliedAmount: '₹25,00,000',
      stage: 'Rejected',
      progress: 60,
      status: 'rejected',
      daysInStage: 0,
      phone: '+91 98765 43223',
      rejectionReason: 'High debt-to-income ratio and inadequate income proof',
      resanctionPossible: true,
      resanctionSteps: ['Reduce existing debt burden', 'Provide additional income sources', 'Add co-applicant'],
      escalationContact: 'Credit Manager - Deepak Joshi',
      escalationPhone: '+91 98765 44001',
      productType: 'Personal Loan',
      actionRequired: true,
      actionOwner: 'RM'
    },
    'L015': {
      id: 'L015',
      name: 'Rahul Jain',
      amount: '₹18,00,000',
      appliedAmount: '₹22,00,000',
      stage: 'Commercial Deviation',
      progress: 75,
      status: 'action-needed',
      daysInStage: 2,
      phone: '+91 98765 43224',
      sanctionedAmount: '₹18,00,000',
      deviationReason: 'FOIR at 68% - exceeds policy limit for requested amount',
      alternativeOptions: ['Accept ₹18L now, top-up after 6 EMIs', 'Add co-applicant to increase eligibility to ₹22L'],
      productType: 'Home Loan',
      actionRequired: true,
      actionOwner: 'RM'
    },
    'L016': {
      id: 'L016',
      name: 'Kavita Bose',
      amount: '₹14,00,000',
      stage: 'LD Pending',
      progress: 82,
      status: 'on-track',
      daysInStage: 1,
      phone: '+91 98765 43225',
      sanctionedAmount: '₹14,00,000',
      productType: 'Personal Loan',
      actionRequired: true,
      actionOwner: 'RM',
      notes: 'RM needs to get customer to review and sign loan documents'
    },
    'L017': {
      id: 'L017',
      name: 'Aditya Rao',
      amount: '₹32,00,000',
      stage: 'BOM Verification',
      progress: 85,
      status: 'on-track',
      daysInStage: 2,
      phone: '+91 98765 43226',
      currentOwner: 'BOM Team',
      escalationContact: 'BOM Manager - Vikram Desai',
      escalationPhone: '+91 98765 44005',
      productType: 'Home Loan',
      actionRequired: false,
      actionOwner: 'BOM Team'
    },
    'L018': {
      id: 'L018',
      name: 'Ishita Bansal',
      amount: '₹9,00,000',
      stage: 'Query from Ops',
      progress: 86,
      status: 'action-needed',
      daysInStage: 2,
      phone: '+91 98765 43227',
      queryType: 'Bank Account Verification',
      queryDetails: 'Customer bank account IFSC mismatch - need correct details',
      queryRaisedBy: 'Ops Team - Priya Kulkarni',
      escalationContact: 'Ops Team - Priya Kulkarni',
      escalationPhone: '+91 98765 44007',
      productType: 'Personal Loan',
      actionRequired: true,
      actionOwner: 'RM'
    },
    'L019': {
      id: 'L019',
      name: 'Manish Khanna',
      amount: '₹26,00,000',
      stage: 'BOC Verification',
      progress: 88,
      status: 'on-track',
      daysInStage: 1,
      phone: '+91 98765 43228',
      currentOwner: 'BOC Team',
      escalationContact: 'BOC Manager - Sunil Patil',
      escalationPhone: '+91 98765 44006',
      productType: 'Home Loan',
      actionRequired: false,
      actionOwner: 'BOC Team'
    },
    'L020': {
      id: 'L020',
      name: 'Shruti Reddy',
      amount: '₹11,00,000',
      stage: 'COA',
      progress: 92,
      status: 'on-track',
      daysInStage: 1,
      phone: '+91 98765 43229',
      currentOwner: 'Disbursement Team',
      productType: 'Personal Loan',
      actionRequired: false,
      actionOwner: 'Disbursement Team',
      notes: 'Payment processing in progress'
    },
    'L021': {
      id: 'L021',
      name: 'Tarun Mehta',
      amount: '₹19,00,000',
      stage: 'Disbursed',
      progress: 100,
      status: 'completed',
      daysInStage: 0,
      phone: '+91 98765 43230',
      disbursedAmount: '₹19,00,000',
      disbursedDate: 'Today',
      productType: 'Business Loan',
      actionRequired: false,
      actionOwner: 'Completed',
      totalTAT: 18
    },
    'L022': {
      id: 'L022',
      name: 'Sachin Malhotra',
      amount: '₹45,00,000',
      stage: 'Parallel Verifications',
      substages: ['FI-Resi', 'FI-Office', 'FCU'],
      progress: 68,
      status: 'action-needed',
      daysInStage: 4,
      phone: '+91 98765 43231',
      productType: 'Home Loan',
      verificationDetails: {
        'FI-Resi': {
          status: 'Query Raised',
          owner: 'FI Agency - QuickVerify',
          daysInStage: 4,
          issue: 'Neighbors not available for verification - customer needs to coordinate',
          actionRequired: true
        },
        'FI-Office': {
          status: 'In Progress',
          owner: 'FI Agency - QuickVerify',
          daysInStage: 2,
          actionRequired: false
        },
        'FCU': {
          status: 'In Progress',
          owner: 'FCU Team',
          daysInStage: 2,
          actionRequired: false
        }
      },
      escalationContact: 'Credit Manager - Deepak Joshi',
      escalationPhone: '+91 98765 44001',
      actionRequired: true,
      actionOwner: 'RM',
      notes: 'FI-Resi is blocked, but FI-Office and FCU are proceeding normally'
    },
    'L023': {
      id: 'L023',
      name: 'Nisha Kapoor',
      amount: '₹35,00,000',
      stage: 'Parallel Verifications',
      substages: ['Legal', 'Technical', 'PD'],
      progress: 64,
      status: 'on-track',
      daysInStage: 3,
      phone: '+91 98765 43232',
      productType: 'Home Loan',
      verificationDetails: {
        'Legal': {
          status: 'In Progress',
          owner: 'Legal Team - Advocate Sharma',
          daysInStage: 3,
          actionRequired: false
        },
        'Technical': {
          status: 'Completed',
          owner: 'Technical Team - Ravi Kumar',
          daysInStage: 0,
          completedDate: 'Yesterday',
          actionRequired: false
        },
        'PD': {
          status: 'In Progress',
          owner: 'PD Agency - Veritas Services',
          daysInStage: 2,
          actionRequired: false
        }
      },
      escalationContacts: {
        'Legal': { name: 'Legal Manager - Pradeep Singh', phone: '+91 98765 44002' },
        'PD': { name: 'Credit Manager - Deepak Joshi', phone: '+91 98765 44001' }
      },
      actionRequired: false,
      actionOwner: 'Verification Teams',
      notes: 'Technical is done, Legal and PD are on track'
    },
    'L024': {
      id: 'L024',
      name: 'Ravi Shankar',
      amount: '₹28,00,000',
      stage: 'Parallel Verifications',
      substages: ['FI-Resi', 'Legal', 'FCU'],
      progress: 66,
      status: 'action-needed',
      daysInStage: 5,
      phone: '+91 98765 43233',
      productType: 'Loan Against Property',
      verificationDetails: {
        'FI-Resi': {
          status: 'In Progress',
          owner: 'FI Agency - QuickVerify',
          daysInStage: 3,
          actionRequired: false
        },
        'Legal': {
          status: 'Query Raised',
          owner: 'Legal Team - Advocate Sharma',
          daysInStage: 5,
          issue: 'Property has encumbrance - need NOC from previous lender',
          actionRequired: true
        },
        'FCU': {
          status: 'Completed',
          owner: 'FCU Team',
          daysInStage: 0,
          completedDate: 'Today',
          actionRequired: false
        }
      },
      escalationContacts: {
        'Legal': { name: 'Legal Manager - Pradeep Singh', phone: '+91 98765 44002' },
        'FI-Resi': { name: 'Credit Manager - Deepak Joshi', phone: '+91 98765 44001' }
      },
      actionRequired: true,
      actionOwner: 'RM',
      notes: 'FCU is done, FI-Resi is fine, but Legal has a critical blocker'
    },
    'L025': {
      id: 'L025',
      name: 'Anjali Deshmukh',
      amount: '₹0',
      appliedAmount: '₹22,00,000',
      stage: 'Rejected',
      progress: 65,
      status: 'rejected',
      daysInStage: 0,
      phone: '+91 98765 43234',
      rejectionReason: 'PD report flagged discrepancies - customer\'s residence address verification failed. Neighbors confirmed customer doesn\'t live at declared address',
      rejectionStage: 'Post-PD Credit Decision',
      rejectedBy: 'Credit Team - Ramesh Iyer',
      resanctionPossible: false,
      productType: 'Personal Loan',
      escalationContact: 'Credit Manager - Deepak Joshi',
      escalationPhone: '+91 98765 44001',
      actionRequired: true,
      actionOwner: 'RM',
      notes: 'Hard rejection due to PD failure - unlikely to be reversed'
    },
    'L026': {
      id: 'L026',
      name: 'Suresh Yadav',
      amount: '₹0',
      appliedAmount: '₹18,00,000',
      stage: 'Rejected',
      progress: 62,
      status: 'rejected',
      daysInStage: 1,
      phone: '+91 98765 43235',
      rejectionReason: 'Credit team not comfortable with PD findings - employment verification showed customer works as contract worker, not permanent employee as declared. Income stability concern',
      rejectionStage: 'Post-PD Credit Decision',
      rejectedBy: 'Credit Team - Suresh Kumar',
      resanctionPossible: true,
      resanctionSteps: ['Get employment contract showing minimum 2-year tenure', 'Provide ITR for last 2 years to prove income stability', 'Consider lower loan amount (₹12-15L)'],
      escalationContact: 'Credit Manager - Deepak Joshi',
      escalationPhone: '+91 98765 44001',
      productType: 'Personal Loan',
      actionRequired: true,
      actionOwner: 'RM',
      notes: 'Soft rejection - can be re-submitted with additional documentation'
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const addBotMessage = (text, leadId = null, actions = null) => {
    setIsTyping(true);
    setTimeout(() => {
      setMessages(prev => [...prev, { 
        type: 'bot', 
        text, 
        timestamp: new Date(),
        leadId,
        actions 
      }]);
      setIsTyping(false);
      if (leadId) {
        setCurrentLeadContext(leadId);
      }
    }, 1000);
  };

  const addUserMessage = (text) => {
    setMessages(prev => [...prev, { type: 'user', text, timestamp: new Date() }]);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Clean old reminders on mount
    cleanOldReminders();
    
    setTimeout(() => {
      addBotMessage("Hey there! I'm here to help you stay on top of your leads. What would you like to check first?", null, null);
    }, 500);
  }, []);

  const parseActionsFromResponse = (responseText) => {
    const actions = [];
    const actionRegex = /ACTION:\s*\[(call|draft|confirm|nudge)\|([^|]+)\|([^\]]+)\]/g;
    let match;
    
    while ((match = actionRegex.exec(responseText)) !== null) {
      const [, type, label, data] = match;
      actions.push({
        type,
        label: label.trim(),
        data: data.trim()
      });
    }
    
    return actions;
  };

  const cleanResponseText = (text) => {
    return text.replace(/ACTION:\s*\[.*?\]\n?/g, '').trim();
  };

  const handleActionClick = (action) => {
    const { type, label, data } = action;
    
    if (type === 'call') {
      window.open(`tel:${data}`);
    } else if (type === 'draft') {
      const draftTypes = {
        'doc_request': 'document request',
        'query_response': 'query response',
        'sanction_script': 'acceptance script',
        'negotiation': 'negotiation points',
        'followup': 'follow-up message',
        'intro': 'introduction message',
        'resanction': 're-sanction plan'
      };
      const messageType = draftTypes[data] || 'message';
      processUserInput(`Can you draft a ${messageType} for this lead?`);
    } else if (type === 'confirm') {
      const confirmMessages = {
        'docs_received': 'Great! Documents received. Now upload them and submit in Sales Central.',
        'customer_accepted': 'Awesome! Customer accepted. Move to LD Pending in Sales Central.',
        'decision_received': 'Got it! Decision recorded. Update the status in Sales Central.',
        'docs_signed': 'Perfect! Documents signed. Should move to disbursal soon!'
      };
      addBotMessage(confirmMessages[data] || 'Action marked! Update in Sales Central to proceed.');
    } else if (type === 'nudge') {
      const nudgeMessages = {
        'resolve_query': 'Open Sales Central to upload documents and resolve the query.',
        'start_application': 'Open Sales Central to start the application.',
        'submit_application': 'Open Sales Central to submit the application.',
        'upload_docs': 'Open Sales Central to upload the documents.',
        'complete_application': 'Open Sales Central to complete the application.'
      };
      addBotMessage(nudgeMessages[data] || 'Open Sales Central to complete this action.');
    }
  };

  const callClaudeAPI = async (userMessage) => {
    try {
      const conversationHistory = messages
        .filter(msg => msg.type === 'user' || msg.type === 'bot')
        .slice(-6)
        .map(msg => ({
          role: msg.type === 'user' ? 'user' : 'assistant',
          content: msg.text
        }));

      const actionNeededCount = Object.values(leadsData).filter(l => l.actionRequired && l.actionOwner === 'RM').length;
      const totalLeads = Object.keys(leadsData).length;
      
      // Check if user is asking about reminders or focus
      const isRemindersQuery = /remind|focus|follow.*up/i.test(userMessage);
      let remindersContext = '';
      
      if (isRemindersQuery) {
        // Determine which date they're asking about
        const today = new Date().toISOString().split('T')[0];
        const tomorrow = new Date(Date.now() + 24*60*60*1000).toISOString().split('T')[0];
        
        let targetDate = today; // default to today
        if (/tomorrow/i.test(userMessage)) {
          targetDate = tomorrow;
        }
        
        const relevantReminders = getRemindersForDate(targetDate);
        
        if (relevantReminders.length > 0) {
          remindersContext = `\n\nREMINDERS FOR ${targetDate === today ? 'TODAY' : 'TOMORROW'}:
${JSON.stringify(relevantReminders, null, 2)}

IMPORTANT: Show these reminders FIRST before action-needed leads when user asks for "focus" or "reminders".`;
        }
      }
      
      // Build context with lead tracking
      let context = `CURRENT CONTEXT:
- RM has ${totalLeads} active leads
- ${actionNeededCount} require RM action
- ${totalLeads - actionNeededCount} are with other teams`;

      // Add current lead context if available
      if (currentLeadContext && leadsData[currentLeadContext]) {
        context += `\n- User is currently discussing lead: ${currentLeadContext} (${leadsData[currentLeadContext].name})`;
      }

      context += remindersContext;

      context += `\n\nLEAD DATA:
${JSON.stringify(leadsData, null, 2)}

USER REQUEST: "${userMessage}"

Respond conversationally and helpfully based on what the RM needs. Keep responses focused and actionable.`;

      const apiMessages = [
        ...conversationHistory,
        { role: "user", content: context }
      ];


        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 2000,
          system: systemPrompt,
          messages: apiMessages,
        })
      });

      const data = await response.json();
      
      if (data.content && data.content[0] && data.content[0].text) {
        return data.content[0].text;
      } else if (data.error) {
        return `Sorry, I encountered an error: ${data.error.message || 'Unknown error'}. Please try again.`;
      } else {
        return "I'm having trouble processing that right now. Could you try asking in a different way?";
      }
    } catch (error) {
      console.error('API Error:', error);
      return "Oops, I'm having some connection issues. Please try again in a moment.";
    }
  };

  const parseReminderFromResponse = (responseText) => {
    // Check if AI is confirming a reminder was set
    const reminderPattern = /REMINDER_SET:\s*(\{[^}]+\})/;
    const match = responseText.match(reminderPattern);
    
    if (match) {
      try {
        const reminderData = JSON.parse(match[1]);
        addReminder(reminderData);
        // Remove the REMINDER_SET marker from response
        return responseText.replace(reminderPattern, '').trim();
      } catch (error) {
        console.error('Error parsing reminder:', error);
      }
    }
    
    return responseText;
  };

  const processUserInput = async (userInput) => {
    addUserMessage(userInput);
    setIsTyping(true);
    
    const response = await callClaudeAPI(userInput);
    
    // Check for reminder creation
    const cleanedResponse = parseReminderFromResponse(response);
    
    const actions = parseActionsFromResponse(cleanedResponse);
    const cleanText = cleanResponseText(cleanedResponse);
    
    // Extract lead ID from current message or maintain context
    const leadMatch = userInput.match(/L0[0-2][0-9]/i);
    let leadId = null;
    
    if (leadMatch) {
      // User mentioned a specific lead
      leadId = leadMatch[0].toUpperCase();
      setCurrentLeadContext(leadId);
    } else if (currentLeadContext) {
      // No lead mentioned but we have context - keep it
      leadId = currentLeadContext;
    }
    
    setTimeout(() => {
      addBotMessage(cleanText, leadId, actions.length > 0 ? actions : null);
    }, 500);
  };

  const handleSend = () => {
    if (input.trim()) {
      processUserInput(input);
      setInput('');
      setShowLeadSuggestions(false);
    }
  };

  const getLeadSuggestions = (inputText) => {
    // Find the last # in the input
    const lastHashIndex = inputText.lastIndexOf('#');
    if (lastHashIndex === -1) return [];
    
    // Get the search term after #
    const searchTerm = inputText.slice(lastHashIndex + 1).toLowerCase();
    
    // Get all leads
    let leads = Object.values(leadsData);
    
    // Prioritize action-needed leads
    leads.sort((a, b) => {
      if (a.actionRequired && a.actionOwner === 'RM' && !(b.actionRequired && b.actionOwner === 'RM')) return -1;
      if (!(a.actionRequired && a.actionOwner === 'RM') && b.actionRequired && b.actionOwner === 'RM') return 1;
      return 0;
    });
    
    // Filter based on search term
    if (!searchTerm) {
      return leads.slice(0, 6); // Show first 6 when just # is typed
    }
    
    return leads.filter(lead => 
      lead.id.toLowerCase().includes(searchTerm) ||
      lead.name.toLowerCase().includes(searchTerm) ||
      lead.stage.toLowerCase().includes(searchTerm)
    ).slice(0, 6);
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setInput(value);
    
    // Check if # was typed
    if (value.includes('#')) {
      const suggestions = getLeadSuggestions(value);
      setLeadSuggestions(suggestions);
      setShowLeadSuggestions(suggestions.length > 0);
      setSelectedSuggestionIndex(0);
    } else {
      setShowLeadSuggestions(false);
    }
  };

  const handleLeadSelect = (lead) => {
    // Find the last # position
    const lastHashIndex = input.lastIndexOf('#');
    
    // Replace from # onwards with the lead ID
    const beforeHash = input.slice(0, lastHashIndex);
    const afterHash = input.slice(lastHashIndex).split(/\s/)[0]; // Get until next space
    const restOfInput = input.slice(lastHashIndex + afterHash.length);
    
    const newInput = beforeHash + `#${lead.id}` + restOfInput;
    setInput(newInput);
    setShowLeadSuggestions(false);
    
    // Focus back on input
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (showLeadSuggestions && leadSuggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev < leadSuggestions.length - 1 ? prev + 1 : prev
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedSuggestionIndex(prev => prev > 0 ? prev - 1 : 0);
      } else if (e.key === 'Enter' && leadSuggestions.length > 0) {
        e.preventDefault();
        handleLeadSelect(leadSuggestions[selectedSuggestionIndex]);
      } else if (e.key === 'Escape') {
        setShowLeadSuggestions(false);
      }
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const resetToDefault = () => {
    setSystemPrompt(`You are a helpful, empathetic lead management assistant for Relationship Managers (RMs) in the lending industry.

PERSONALITY: Warm, conversational, empathetic, action-oriented, concise, DISBURSAL-FOCUSED (RMs earn on disbursals), neutral and supportive, fact-based only.

CRITICAL RESPONSE RULES:
1. BREVITY: Keep responses 50% shorter than normal
2. NO REPETITION: Skip intro/status recap - user knows basics
3. NATURAL FLOW: Never use headers like "What needs your attention"
4. BLENDED ACTIONS: Weave what needs attention into action steps conversationally
5. GET TO THE POINT: Start with what matters most
6. DISBURSAL URGENCY: Frame actions in terms of getting to disbursal faster
7. NEUTRAL TONE: Frame as opportunities, not failures
8. NO FABRICATION: ONLY use info from lead data - NEVER assume

DISBURSAL OPTIMIZATION: RMs make money ONLY on disbursals. Stages are chronological: Received → Drafts → CPA/Login → Credit → Verifications → Sanctioned → LD Pending → BOM/BOC → COA → Disbursed. Later stages (COA, BOC, BOM, Query from Ops, LD Pending, Sanctioned) are CLOSEST to disbursal - TOP PRIORITY. When showing "focus", rank by: (1) Latest stage + action needed, (2) Blocked/queries at any stage, (3) Early stage leads.

PRIORITY FRAMEWORK:
1. HIGHEST PRIORITY (Days from disbursal): COA, BOC/BOM Verification, Query from Ops, LD Pending
2. HIGH PRIORITY (Weeks from disbursal): Sanctioned, Commercial Deviation
3. MEDIUM PRIORITY (Blocked mid-stage): Query from Credit, Final Appraisal/FCU, Rejected (re-sanction possible)
4. LOWER PRIORITY (Months from disbursal): Verifications (on-track), Credit Appraisal, CPA/Login, Drafts, Received

REMINDERS: RMs get verbal commitments not in Sales Central. Help track these.
SETTING: When RM says "Remind me to follow up with Sneha tomorrow" → Parse: lead ID, actor, phone, commitment, date. Respond: "Got it! I'll remind you tomorrow to follow up with Sneha on [commitment]." Then add: REMINDER_SET: {"leadId":"L004","actor":"Sneha Reddy","actorPhone":"+91...","commitment":"...","dueDate":"2025-12-29"}
SHOWING: When "focus today" or "reminders for today/tomorrow" → Show reminders FIRST with 🔔. Format: "🔔 2 follow-ups for today: - L004 - Sneha: Follow up on salary slips" + call button only. Then show action-needed leads.
DATES: "tomorrow"→next day, "Friday"→next Friday, "in 3 days"→+3, "Dec 30"→that date. Use YYYY-MM-DD.
RULES: Only show when RM asks. Never show overdue. Just call button, no snooze/done.

TAT RULES: NEVER mention estimated TAT or "normally takes X days" or "should take X days" or "expected in X days". You DON'T KNOW normal timelines. ONLY state facts: "Has been with credit team for 4 days" is GOOD. "Should take 5 days" is FORBIDDEN. IF lead with another team >1 day: Tell RM to follow up to expedite. For parallel verifications: State days for EACH separately ("FI-Office ongoing for 2 days, Legal initiated yesterday").

RESPONSE FORMATTING: Always include lead ID with name: "L001 - Rajesh Kumar". Use mobile numbers only, NEVER extensions.

STAGE TRANSLATION (never say stage names - blend into conversation):
Received=Just allocated/Fresh lead, Drafts=You haven't submitted/Still in your bucket, CPA/Login=File checker reviewing/Login desk has it, Query from Credit=Credit team waiting on you/Need clarification, Credit Appraisal=Credit team evaluating/Underwriting, Sanctioned=Approved! You need to get customer acceptance, Rejected=Not approved/Declined, Commercial Deviation=You need to negotiate and get customer's decision, LD Pending=You need to get customer signatures on loan docs to disburse, Disbursed=Done! Money sent - you earned on this

RM-FOCUSED LANGUAGE: Say "It's been with you for X days" NOT "Customer waiting". Say "You need to collect docs" NOT "Pending documents". Say "You need to get customer signatures" NOT "Waiting for customer to sign". Say "Credit team raised a query 3 days ago" NOT "Customer has been waiting on you". Say "You need to collect salary slips" NOT "Credit team needs salary slips". TONE: Keep neutral/supportive, never accusatory. Say "This has been with you for 2 days" NOT "Sitting on this". Frame as opportunities not failures.

CONVERSATION STYLE: Use first names naturally. Acknowledge difficulty when relevant. Be specific and actionable. One "pro tip" max per response. NO section headers. Remind about disbursal opportunity. Always neutral and supportive. Avoid: "sitting on", "haven't done", "delayed", "behind", "neglected". Use: "been with you", "ready to move forward", "opportunity to progress", "can action this".

QUESTION GUIDELINES: NEVER ask RM to predict customer behavior ("What do you think they'll do?"). NEVER ask RM for info in system ("Is this their first loan?"). Ask ONLY about: RM's next actions, preferences on approach, clarifications on RM's plans.

FABRICATION RULES: ONLY use info explicitly in lead data. NEVER assume timelines/events not in data. If info not in data, DON'T mention it. NEVER say "on track", "delayed", "taking too long", "normally takes X days", "should complete in X days" - you DON'T KNOW expected timelines or normal durations. ONLY state facts: "Been with credit for 4 days" is GOOD. "Moving on schedule" or "Taking longer than usual" is BAD. For parallel verifications: State days for EACH from data.

ACTION BUTTONS - CRITICAL:
When discussing a specific lead, you MUST suggest 2-4 action buttons at END of response.
Format EXACTLY: ACTION: [type|label|data]

Types:
- call: ACTION: [call|📞 Call Priya|+91 98765 43211]
- draft: ACTION: [draft|📝 Draft Document Request|doc_request]
- confirm: ACTION: [confirm|✓ Mark Docs Received|docs_received]
- nudge: ACTION: [nudge|→ Submit in Sales Central|submit_application]

App CTA Language (RM-focused, direct commands):
✅ "Complete Application" NOT "Help Complete"
✅ "Upload in Sales Central" NOT "Nudge to Upload"
✅ "Resolve Query in Sales Central" NOT "Help Resolve"
✅ "Submit Application" NOT "Go Submit"

Draft contexts: doc_request, query_response, sanction_script, negotiation, followup, intro, resanction
Confirm types: docs_received, customer_accepted, decision_received, docs_signed
Nudge types: resolve_query, start_application, submit_application, upload_docs, complete_application

Example for Drafts:
"L002 - Priya needs 3 documents from you. Call her, get the docs via WhatsApp, then submit in Sales Central.

ACTION: [call|📞 Call Priya|+91 98765 43211]
ACTION: [draft|📝 Draft Document Request|doc_request]
ACTION: [confirm|✓ Mark Docs Received|docs_received]
ACTION: [nudge|→ Submit in Sales Central|submit_application]"

DISBURSAL CELEBRATIONS: When discussing Disbursed lead, celebrate: "🎉 {Name}'s loan of {Amount} disbursed today! Nice work! 💰"

Example: "🎉 Tarun Mehta's loan of ₹19 lacs disbursed today! Nice work! 💰"

Remember: RMs busy. Respect time. Every word counts. Sound like colleague not report. Help close deals and earn through disbursals. Always neutral/supportive. Stick to facts from system only.`);
  };

  const QuickAction = ({ text, onClick }) => (
    <button
      onClick={onClick}
      className="px-3 sm:px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-xs sm:text-sm hover:bg-blue-100 transition-colors whitespace-nowrap flex-shrink-0"
    >
      {text}
    </button>
  );

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="bg-white shadow-sm border-b border-gray-200 p-3 sm:p-4">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <User className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-gray-800">Lead Tracker</h1>
              <p className="text-xs text-gray-500 hidden sm:block">AI-Powered Assistant</p>
            </div>
          </div>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            title="Configure AI Prompt"
          >
            <Settings className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      {showSettings && (
        <div className="bg-white border-b border-gray-200 p-4 shadow-lg">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-gray-800">AI System Prompt Configuration</h2>
              <button
                onClick={() => setShowSettings(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              Customize how the AI assistant behaves and responds.
            </p>
            <textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              className="w-full h-64 p-3 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Enter system prompt..."
            />
            <div className="flex gap-2 mt-3">
              <button
                onClick={resetToDefault}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition-colors"
              >
                Reset to Default
              </button>
              <button
                onClick={() => setShowSettings(false)}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition-colors"
              >
                Save & Close
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4 max-w-4xl mx-auto w-full">
        {messages.map((msg, idx) => (
          <div key={idx}>
            <div className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-2xl px-3 sm:px-4 py-2 sm:py-3 ${
                msg.type === 'user'
                  ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white'
                  : 'bg-white text-gray-800 shadow-sm border border-gray-100'
              }`}>
                <div className="whitespace-pre-wrap text-xs sm:text-sm leading-relaxed">
                  {msg.text}
                </div>
                <div className={`text-xs mt-1 ${msg.type === 'user' ? 'text-blue-100' : 'text-gray-400'}`}>
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
            
            {msg.type === 'bot' && msg.actions && msg.actions.length > 0 && (
              <div className="flex gap-2 mt-2 flex-wrap justify-start ml-1 sm:ml-2">
                {msg.actions.map((action, actionIdx) => (
                  <button
                    key={actionIdx}
                    onClick={() => handleActionClick(action)}
                    className="px-2 sm:px-3 py-1.5 sm:py-2 bg-blue-50 text-blue-700 text-xs sm:text-sm rounded-lg hover:bg-blue-100 transition-colors border border-blue-200 font-medium"
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
        
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white rounded-2xl px-3 sm:px-4 py-2 sm:py-3 shadow-sm border border-gray-100">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 bg-white border-t border-gray-200">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-2 justify-center overflow-x-auto pb-1">
            <QuickAction text="📊 My Pipeline" onClick={() => processUserInput("Show my pipeline")} />
            <QuickAction text="⚡ Focus" onClick={() => processUserInput("What should I focus on today?")} />
          </div>
          <p className="text-xs text-gray-500 mt-2 text-center">
            Type # to search leads • Or just ask in chat
          </p>
        </div>
      </div>

      <div className="bg-white border-t border-gray-200 p-3 sm:p-4">
        <div className="max-w-4xl mx-auto">
          <div className="relative">
            {/* Lead Suggestions Dropdown */}
            {showLeadSuggestions && leadSuggestions.length > 0 && (
              <div className="absolute bottom-full left-0 right-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto z-10">
                {leadSuggestions.map((lead, index) => (
                  <button
                    key={lead.id}
                    onClick={() => handleLeadSelect(lead)}
                    className={`w-full px-3 sm:px-4 py-2 sm:py-3 text-left border-b border-gray-100 last:border-b-0 transition-colors ${
                      index === selectedSuggestionIndex ? 'bg-blue-50' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-800 text-sm truncate">
                          #{lead.id} - {lead.name}
                        </div>
                        <div className="text-xs text-gray-500 truncate">
                          {lead.stage} • {lead.amount || lead.appliedAmount}
                        </div>
                      </div>
                      {lead.actionRequired && lead.actionOwner === 'RM' && (
                        <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full whitespace-nowrap flex-shrink-0">
                          🔴 Action
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
            
            {/* Input Area */}
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Type # for leads or ask anything..."
                className="flex-1 px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim()}
                className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-full w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center hover:from-blue-600 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md flex-shrink-0"
              >
                <Send className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeadTrackerApp;
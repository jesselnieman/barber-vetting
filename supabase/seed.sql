-- Center City Barbers — demo seed data
-- Run AFTER schema.sql. Inserts the mock candidates and a reviewer allowlist
-- entry. Re-running clears and re-seeds the demo rows (it does NOT touch real
-- applications, which all have a generated uuid distinct from the fixed demo ids).

-- 1) Reviewer allowlist. CHANGE THIS to the email Bruce will receive magic
--    links at. Only allow-listed emails can read the candidate inbox.
insert into public.reviewers (email) values
  ('centercitybarbers@gmail.com')
on conflict (email) do nothing;

-- 2) Demo candidates. Fixed ids so re-seeding is idempotent.
delete from public.submissions where id in (
  '00000000-0000-4000-8000-000000000001',
  '00000000-0000-4000-8000-000000000002',
  '00000000-0000-4000-8000-000000000003',
  '00000000-0000-4000-8000-000000000004',
  '00000000-0000-4000-8000-000000000005'
);

insert into public.submissions (id, created_at, name, email, phone, years, status, answers, flags) values (
  '00000000-0000-4000-8000-000000000001',
  '2026-04-14T14:22:00',
  $name$Marcus Delacroix$name$,
  $email$marcus.delacroix@gmail.com$email$,
  $phone$(863) 555-0147$phone$,
  9,
  'new',
  $answers${
  "q1": "Yes",
  "q2": "Yes",
  "q3": "Yes, I understand and can commit",
  "q4": [
    "Fades",
    "Tapers",
    "Skin fades",
    "Beard trims",
    "Straight razor shaves",
    "Hot towel service",
    "Long hair / scissor work"
  ],
  "q5": "Strong — clients come back specifically for my work",
  "q6": [
    "Freestyle / design work",
    "Head massage"
  ],
  "q7": "Skin fades are my bread and butter — I blend with guards down to a zero and finish with a razor line that holds for two weeks. People travel for it.",
  "q8": "I have a solid book of regulars",
  "q9": "I use a booking app and manage it myself",
  "q10": "A few times a week",
  "q11": "https://instagram.com/delacroix.cuts",
  "q12": "Firm handshake, ask what they came in for and what they hated about their last cut. Then I shut up and listen before I ever pick up the clippers.",
  "q13": "I own it immediately. I ask exactly what's wrong, fix it if I can, and if I can't, the next cut is on me. Never let a client leave unhappy twice.",
  "q14": "Music is right, chairs are full, barbers are cracking jokes between clients but locked in during the cut. Energy you can feel from the sidewalk.",
  "q15": "I'm the guy who organizes the after-shift food run. I also sweep other people's stations when I'm between clients. Shop pride.",
  "q16": "I use the time to sharpen my skills or clean my station",
  "q17": "I'm always where I say I'll be",
  "q18": "Mid-career — established and looking for the right home",
  "q19": "Worked a shop where the owner played favorites with walk-ins. Taught me that a shop lives or dies on fairness. I want a room where everyone eats.",
  "q20": "I've been watching CCB on Instagram since Bruce opened. The Philly roots resonate — my old man was a barber in South Philly. Would be honored to be part of this chapter."
}$answers$::jsonb,
  $flags$[]$flags$::jsonb
);

insert into public.submissions (id, created_at, name, email, phone, years, status, answers, flags) values (
  '00000000-0000-4000-8000-000000000002',
  '2026-04-13T09:45:00',
  $name$Teagan Ruiz$name$,
  $email$teagan.r.cuts@gmail.com$email$,
  $phone$(407) 555-0209$phone$,
  3,
  'reviewed',
  $answers${
  "q1": "Yes",
  "q2": "I'd need to discuss my schedule",
  "q3": "I'd need to know more before committing",
  "q4": [
    "Fades",
    "Tapers",
    "Beard trims",
    "Kids' cuts",
    "Blow dry styling"
  ],
  "q5": "Solid — can handle most requests",
  "q6": [
    "None of the above"
  ],
  "q7": "My beard trims. I take the extra time to line up, oil, and style — clients tell me it's the reason they rebook.",
  "q8": "I have some regulars but rely on walk-ins",
  "q9": "I do a mix of both",
  "q10": "Once a week or so",
  "q11": "",
  "q12": "I just talk to them. Ask about their week, their job, their kids. People want to feel seen.",
  "q13": "I ask what they'd change and try to fix it in the chair before they leave.",
  "q14": "Good music, steady flow of clients, and at least one funny moment with the other barbers.",
  "q15": "I try to keep the mood light. I'm not the loudest person in the room but I'm steady.",
  "q16": "I stay ready and find ways to stay productive",
  "q17": "I'm usually reliable, with occasional exceptions",
  "q18": "Building — got skills, growing my clientele",
  "q19": "At my last shop the owner cut corners on sanitation. Taught me that small stuff compounds — clean station, clean reputation.",
  "q20": "Looking for a home where I can grow. Heard good things about the culture here from a mutual friend."
}$answers$::jsonb,
  $flags$[]$flags$::jsonb
);

insert into public.submissions (id, created_at, name, email, phone, years, status, answers, flags) values (
  '00000000-0000-4000-8000-000000000003',
  '2026-04-10T18:12:00',
  $name$Devon Alvarez$name$,
  $email$devon@devoncuts.co$email$,
  $phone$(813) 555-0388$phone$,
  14,
  'shortlist',
  $answers${
  "q1": "Yes",
  "q2": "Yes",
  "q3": "Yes, I understand and can commit",
  "q4": [
    "Fades",
    "Tapers",
    "Skin fades",
    "Beard trims",
    "Straight razor shaves",
    "Hot towel service",
    "Kids' cuts",
    "Long hair / scissor work",
    "Afro / textured hair",
    "Blow dry styling"
  ],
  "q5": "Elite — I can execute virtually anything that sits in my chair",
  "q6": [
    "Freestyle / design work",
    "Facial treatments (masks, scrubs)",
    "Head massage"
  ],
  "q7": "Straight razor shave with hot towel. I was trained by an old-school barber in Ybor who wouldn't let me touch a client for a full year. That discipline stuck.",
  "q8": "I have a solid book of regulars",
  "q9": "I prefer the shop to handle scheduling",
  "q10": "Daily",
  "q11": "https://instagram.com/devoncuts",
  "q12": "Eye contact, firm handshake, and I always ask about the last cut they loved — not the ones they hated. Tells me what they actually want.",
  "q13": "Silent ego check first. Then I ask them to show me exactly where it's off. Nine times out of ten it's a small fix. If it's a big fix, it's on me — free cut next time and we rebuild trust.",
  "q14": "The door swinging open all day, music keeping the tempo, four conversations at once but every cut getting full attention. That's the shop I want to work in.",
  "q15": "I mentor. Every shop I've been in, I end up being the guy the younger barbers come to. I share my book when it makes sense. A rising tide.",
  "q16": "I promote myself on social media to drive traffic",
  "q17": "I'm always where I say I'll be",
  "q18": "Veteran — I've been doing this a long time",
  "q19": "Spent four years at a shop where the owner wouldn't invest back into the space. Chairs falling apart, busted clippers. Taught me that environment matters as much as skill. Clients feel it.",
  "q20": "I've cut Bruce's cousin for six years. He's been telling me to apply since you opened. Finally listening. I'd bring 80+ regulars with me."
}$answers$::jsonb,
  $flags$[]$flags$::jsonb
);

insert into public.submissions (id, created_at, name, email, phone, years, status, answers, flags) values (
  '00000000-0000-4000-8000-000000000004',
  '2026-04-08T11:03:00',
  $name$Jaylen Park$name$,
  $email$jaylen.park@outlook.com$email$,
  $phone$(727) 555-0412$phone$,
  1,
  'new',
  $answers${
  "q1": "No",
  "q2": "Yes",
  "q3": "Yes, I understand and can commit",
  "q4": [
    "Fades",
    "Tapers",
    "Beard trims",
    "Kids' cuts"
  ],
  "q5": "Still developing",
  "q6": [
    "None of the above"
  ],
  "q7": "I'm best at classic tapers. I take my time and my lines are clean.",
  "q8": "I'm building my clientele from scratch",
  "q9": "I'm flexible and open to whatever works",
  "q10": "Rarely",
  "q11": "",
  "q12": "Ask them about their day and keep it casual.",
  "q13": "Apologize and try to fix it.",
  "q14": "Busy and fun.",
  "q15": "I try to be helpful and keep a positive attitude.",
  "q16": "I get frustrated if I'm not busy",
  "q17": "It depends on circumstances",
  "q18": "Just starting out",
  "q19": "Worked at a chain shop where I felt rushed. Learned I do my best work when I have time to focus.",
  "q20": "I'm hungry to learn. I know I'm early in my career but I'm willing to put in the work. My license should be finalized in the next few weeks."
}$answers$::jsonb,
  $flags$[{"qid":"q1","kind":"qualifier","prompt":"Do you hold a current, valid barber license in Florida?","answer":"No"},{"qid":"q16","kind":"reliability","prompt":"How do you handle a slow day with light walk-in traffic?","answer":"I get frustrated if I'm not busy"},{"qid":"q17","kind":"reliability","prompt":"How would you honestly describe your punctuality and consistency?","answer":"It depends on circumstances"}]$flags$::jsonb
);

insert into public.submissions (id, created_at, name, email, phone, years, status, answers, flags) values (
  '00000000-0000-4000-8000-000000000005',
  '2026-04-05T16:30:00',
  $name$Rosalind Chen$name$,
  $email$rosalind.chen.bb@gmail.com$email$,
  $phone$(954) 555-0156$phone$,
  6,
  'reviewed',
  $answers${
  "q1": "Yes",
  "q2": "Yes",
  "q3": "Yes, I understand and can commit",
  "q4": [
    "Fades",
    "Tapers",
    "Skin fades",
    "Beard trims",
    "Hot towel service",
    "Long hair / scissor work",
    "Afro / textured hair"
  ],
  "q5": "Strong — clients come back specifically for my work",
  "q6": [
    "Braiding",
    "Head massage"
  ],
  "q7": "Textured hair cuts. I cut dry so I can see the curl pattern — it's slower but the shape holds better for longer.",
  "q8": "I have some regulars but rely on walk-ins",
  "q9": "I do a mix of both",
  "q10": "A few times a week",
  "q11": "https://instagram.com/roz.cuts.fl",
  "q12": "I ask what they're doing later that day. Tells me how sharp the cut needs to be and gets them talking about their life.",
  "q13": "Apologize, listen, fix. In that order. The apology has to come first or they won't believe the fix.",
  "q14": "Regulars bringing coffee in, one or two new faces from walk-ins, and I'm finishing the day with my station clean and my mind quiet.",
  "q15": "I bring in food on Fridays. Small thing but it matters. Also I'm the one who actually restocks the bathroom.",
  "q16": "I stay ready and find ways to stay productive",
  "q17": "I'm always where I say I'll be",
  "q18": "Building — got skills, growing my clientele",
  "q19": "Worked somewhere that didn't take textured hair seriously. Taught me that specialization isn't a gimmick — it's how you build a book that's yours.",
  "q20": "Your shop looks like the kind of place I'd want to go as a client. That's how I pick where to work."
}$answers$::jsonb,
  $flags$[]$flags$::jsonb
);


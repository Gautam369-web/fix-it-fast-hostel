# Fix It Fast: Hostel Maintenance Complaints — UX Rationale, IA & Complaint Journey Storyboard

## 1. UX Rationale
- **Resident (Student)**: Tired, busy student who wants a broken tap or fan fixed in under 60 seconds and 5 taps without chasing wardens. Key decisions: one-question-per-step liquid-wave form (`Room -> Category -> Priority -> Details & Photo -> Review`), automatic local draft saving, duplicate-ticket detection per room+category, and a live TicketOrb + vertical timeline so complaints never feel lost.
- **Warden**: Overloaded administrator managing multiple hostel blocks. Key decisions: desktop-ready dense yet calm overview with 6 glass summary tiles, pinned Overdue escalations tied to the 3D Clock Tower, skill/workload-aware assignment, bulk assignment, and configurable SLA hours per priority.
- **Maintenance Staff**: Technician working on-the-go from a phone. Key decisions: priority-and-due-sorted job queue, one-tap status updates (`In progress`, `Waiting for parts`, `Resolved`) with compressed proof photos that immediately append to the resident's timeline and animate the 3D TicketOrb.

## 2. Information Architecture & Screen List per Role
No top navbar — navigation uses a **role-aware floating glass BottomDock** mapped to **The Hostel Quarter** buildings:
- **Resident (5 segments)**: `Home` (Hostel Block summary + quick campus map) · `New Ticket` (Hostel Block 5-step wizard) · `My Tickets` (Notice Board Tower list + Ticket Detail timeline + Feedback Gazebo rating) · `Alerts` (Clock Tower & live notifications) · `Profile` (Main Gate persona switch).
- **Warden (5 segments)**: `Overview` (Warden's Office KPIs, Overdue list, Recharts category/block charts) · `Tickets` (Notice Board filterable board + bulk assign) · `Staff` (Workshop skill & workload roster) · `Reports` (Clock Tower configurable SLA rules) · `Settings` (Theme, language, accessibility).
- **Maintenance Staff (3 segments)**: `My Jobs` (Workshop queue) · `Updates` (Utility Yard status + photo update) · `History` (Feedback Gazebo completed ratings).

## 3. Design Tokens (3D Glassy Lens + Monochrome Frost/Obsidian)
- **Obsidian**: `--bg-base: #090d16`, `--glass-bg: rgba(255,255,255,0.08)`, `--glass-bg-elevated: rgba(18,24,39,0.62)`, `--text-primary: #f4f6fb`, `--accent-amber: #e6aa54`.
- **Frost**: `--bg-base: #e7ecf3`, `--glass-bg: rgba(255,255,255,0.60)`, `--glass-bg-elevated: rgba(255,255,255,0.76)`, `--text-primary: #111827`, `--accent-amber: #b36b14`.
- **Lens Refraction**: Top-left bright specular border (`--glass-border-top`), convex top inset highlight + concave bottom shadow (`--glass-lens-inset`), `backdrop-filter: blur(18-24px) saturate(155-165%)`, SVG `#liquid-lens` displacement filter, and solid opaque fallbacks for `prefers-reduced-transparency` / `@supports not (backdrop-filter)`.
- **Motion Springs**: Dock droplet thumb `stiffness: 260, damping: 24` (~380ms stretch), button tap `scale: 0.97`, 3D scene CatmullRom path travel.

## 4. Frame-by-Frame Storyboard: "The 8-Step Complaint Journey"
| Step | Status / Trigger | 3D Campus Path & TicketOrb Motion | 2D Glass UI & Lights |
| :--- | :--- | :--- | :--- |
| **1. Submit** | Resident submits 5-step form | Form folds into glowing glass TicketOrb (`Open`) and launches from Hostel Block window. | Room window pane lights **amber**; toast confirms Ticket ID `FIF-xxxx`. |
| **2. Assign** | Warden assigns staff | Orb arcs along CatmullRom curve to **Warden's Office** tray and links a glowing thread to staff. | Timeline draws new `Assigned` step; resident receives notification. |
| **3. In Progress** | Staff starts repair | Orb travels via **Workshop** to room; rotating wrench indicator hovers overhead. | Timeline shows live working shimmer; status chip morphs. |
| **4. Waiting Parts** | Staff flags parts needed | Orb parks at **Utility Yard** with a calm breathing pulse. | Timeline appends parts note; resident sees next step clearly. |
| **5. Resolved** | Staff marks fixed | Orb brightens and flies back to **Hostel Block** window; window dims from amber. | Soft chime (if enabled); resident sees "Is it fixed?" card. |
| **6. Confirm + Rate** | Resident confirms & rates | Ribbon carries orb to **Feedback Gazebo**; 5 glass star crystals illuminate. | Stars fill sequentially with sparkle; status closes (`Closed`). |
| **7. Reopened** | Resident rejects fix | Orb reverses in warm amber tint back to **Warden's Office**. | `reopenCount` increments; Warden gets escalation alert. |
| **8. Overdue SLA** | `dueAt` exceeded | Orb trail flickers amber and **Clock Tower** beacon pulses continuously. | Pinned Overdue card breathes gently; resident can tap **Nudge warden**. |

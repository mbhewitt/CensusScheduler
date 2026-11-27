// In-app help text for the "?" buttons (Chipper, #814). Plain, friendly copy
// that names and explains every section, field, link and button on a screen.
// `name` must match the on-screen label exactly. Keep it non-technical: no
// code terms, and never present shift points as a reward.

export interface IHelpItem {
  name: string;
  text: string;
}
export interface IHelpSection {
  heading: string;
  intro?: string;
  items: IHelpItem[];
}
export interface IHelpPage {
  title: string;
  sections: IHelpSection[];
}

export const helpChecklistPage: IHelpPage = {
  title: "Census Volunteer Checklist",
  sections: [
    {
      heading: "Top bar",
      intro:
        "The bar across the top of every page. It stays in place as you move around the app.",
      items: [
        {
          name: "☰ menu",
          text: "Opens the menu on the left side of the screen: Home, Shifts, Training, Reports, Help and Contact. Tap a name to go to that page. Your name and a Sign out button are at the bottom of the menu.",
        },
        {
          name: "Avatar circle",
          text: "The circle on the right shows the first letter of your playa name (or the initials of your world name if you have no playa name). Tap it to open your account menu.",
        },
        {
          name: "My profile",
          text: "Opens a pop-up showing your names, email and roles, plus your passcode for the tablets. Close it with the X to come back to the page you were on.",
        },
        {
          name: "My shifts",
          text: "Takes you to the Shifts page, which shows the shifts you have signed up for along with the shifts you can still sign up for.",
        },
        {
          name: "App settings",
          text: "Opens a pop-up where you choose whether to receive emails from Census.",
        },
        {
          name: "Sign out",
          text: "Signs you out on this device. On the Census Lab tablets you are also signed out automatically after about five minutes without any activity, so the next person starts fresh.",
        },
      ],
    },
    {
      heading: "Page banner",
      items: [
        {
          name: "Census Volunteer Checklist",
          text: "The title of your home page. Everything below is about you: what Census needs from you before the event and where you stand.",
        },
        {
          name: "Shifts-released notice (blue banner)",
          text: "A blue notice shown to everyone on this page letting you know when next year's volunteer shifts will be released. It is informational only; there is nothing to click.",
        },
      ],
    },
    {
      heading: "Census Volunteer Pre-playa Checklist",
      intro:
        "This card lists the things Census asks every volunteer to do before the event. Items that still need you are open and listed first. Items you have finished are tucked into a folded list at the bottom.",
      items: [
        {
          name: "Action needed / Completed",
          text: "The key to the little boxes next to each item. An empty box means there is still something to do. A green checked box means that item is done. Each item checks itself off as soon as the thing it asks for is true; you do not tick it yourself unless the item has its own checkbox.",
        },
        {
          name: "Your current total: N Census Shift Points (CSP) scheduled",
          text: "A blue note adding up the points of every shift you are currently signed up for. Shifts you remove stop counting, and shifts you add are counted right away. It appears if you are planning to arrive before the gates open (and are not getting early entry another way) or if you have a camping or ticket requirement. Census Staff do not see it.",
        },
        {
          name: "Setup Access Pass (SAP) box",
          text: "A green box that appears once you have met all the requirements for a Setup Access Pass (early entry) or Census has assigned you one. It tells you the day the pass is for. Once Census has issued your pass, a Download button appears so you can save and print it before you come to playa.",
        },
        {
          name: "All items complete!",
          text: "Shown in place of the open items when every checklist item is done.",
        },
        {
          name: "View N completed items",
          text: "A folded list of everything you have already finished. Tap it to open the list, and tap any finished item to look at it again. The number changes as you finish more.",
        },
      ],
    },
    {
      heading:
        "Learn more about Black Rock City Census by reviewing the Census community on Burning Man Hive",
      intro:
        "Always on your checklist, and listed first. It checks off once you have either finished the Welcome course or told us you already know the material.",
      items: [
        {
          name: "Review the Census community on Hive",
          text: "Opens the Census community on Burning Man Hive in a new tab, where you can learn what Census does and what your volunteering makes possible. On the Census Lab tablets (which have no internet) this link instead opens the Census Welcome and Overview course that is stored on the tablet. Just opening the page does not check the item off.",
        },
        {
          name: "I am already familiar with this information. Mark this item as complete.",
          text: "A shortcut for returning volunteers. Tapping it takes you to a confirmation page, and once you confirm, this item is checked off and the Welcome course is recorded as done for you. It disappears once the item is complete.",
        },
      ],
    },
    {
      heading: "View/Add Census shifts",
      intro:
        "Always on your checklist. It checks off once you are signed up for shifts adding up to at least 6 Census Shift Points, and it stays checked as long as you do. You can still add more or change your schedule at any time.",
      items: [
        {
          name: "Browse and sign up for shifts",
          text: "Takes you to the Shifts page, where you can look through open shifts and sign up. When you sign up, a confirmation email with a calendar invite is sent to you, unless you have turned emails off in App settings.",
        },
      ],
    },
    {
      heading: "View my current shifts",
      intro:
        "Always on your checklist and never checked off, because you may come back to it for other reasons (for example to look up a time or remove a shift). Open it to see every shift you are signed up for.",
      items: [
        {
          name: "My Shifts",
          text: "Your personal list of signed-up shifts, soonest first. On a phone each shift appears as its own small card instead of a table row.",
        },
        {
          name: "Add shift",
          text: "Takes you to the Shifts page to sign up for another shift.",
        },
        {
          name: "Search and filter (above the table)",
          text: 'Use the magnifying glass to search your shifts by typing part of a date, time or position. Use the funnel to show only certain dates or positions, and "Reset all filters" to see everything again. These only change what you see; they never change your shifts.',
        },
        {
          name: "Date",
          text: "The day of the shift. Tap the heading to sort your list by date.",
        },
        {
          name: "Time",
          text: "When the shift starts and ends. Tap the heading to sort by time.",
        },
        {
          name: "Position",
          text: "The job you signed up for, shown as a colored tag (the color groups similar kinds of shifts). Tap the heading to sort by position. If a shift has been canceled, the tag is crossed out and marked CANCELED; you do not need to do anything.",
        },
        {
          name: "Check in",
          text: "Only shown on the Census Lab tablets on playa. Slide the switch on when you arrive for your shift so Census knows you showed up. The switch only works from one hour before the shift starts until two hours after it ends; before and after that it is greyed out. If you slide it off again you will be asked to confirm.",
        },
        {
          name: "Actions (⋯ menu)",
          text: "Opens a small menu for that shift with two choices: View volunteers and Remove shift.",
        },
        {
          name: "View volunteers",
          text: "Shows who else is signed up for that shift. It does not change anything.",
        },
        {
          name: "Remove shift",
          text: "Lets you drop a shift you can no longer work. It is available any time before the shift and up to two hours after it ends; after that it is greyed out. It opens a confirmation box (Cancel or Remove shift). Removing frees the spot for someone else, takes that shift's points off your total, and sends you an email with a calendar cancellation (unless you have turned emails off).",
        },
        {
          name: "I understand this leaves a critical position unfilled",
          text: "Appears in the removal box only for critical positions, which must always be staffed. You have to tick it before Remove shift will work, and the Census volunteer coordinators are told so they can find a replacement.",
        },
      ],
    },
    {
      heading: "Tell us your plans for this year’s event",
      intro:
        "Always on your checklist. Everything here saves on its own as soon as you change it; there is no Save button. Before the event it checks off once you have picked an arrival date and described where you will camp. On the Census Lab tablets it only needs the camping description.",
      items: [
        {
          name: "Desired / Expected Arrival Date",
          text: "A drop-down of event days, from the early days before gates open through Temple Sunday. Choose the day you expect to arrive. Census uses it to work out whether you need early entry and which days you need to work. This question is hidden on the tablets once you are on playa.",
        },
        {
          name: "We set your arrival to the day before your first shift",
          text: "A note that appears when you signed up for an early shift and had no arrival date (or a later one), so Census filled it in for you. Change the drop-down if you are arriving earlier. The note goes away once you choose a date yourself.",
        },
        {
          name: "Early Entry",
          text: 'Appears only if the arrival date you picked is before the gates open. Choose "I would like Census to provide early entry" if you want to earn a Setup Access Pass through Census shifts, or "I already have early entry through another department" if another group is taking care of it. The second choice removes the Census early-entry item from your checklist and means Census will not issue you a pass. You can switch back at any time.',
        },
        {
          name: "Tell us about where you will be camping",
          text: "A box to write where people can find you on playa (for example your camp name and street address) and anything else that is useful. It saves when you tap or click outside the box. Leave it empty and this item stays open.",
        },
      ],
    },
    {
      heading: "Review and sign the Behavioral Standards Agreement",
      intro:
        "Always on your checklist. It checks off once you have signed the agreement. All volunteers must sign before taking part.",
      items: [
        {
          name: "Review and sign the Behavioral Standards Agreement",
          text: "Opens the agreement for you to read. At the bottom you can sign it, which checks this item off and takes you back to your checklist. If you decline instead, that is recorded and you are signed out. On the Census Lab tablets you will be sent to this page until you have signed.",
        },
      ],
    },
    {
      heading: "Review and update your Burner Profile",
      intro:
        "Always on your checklist. It checks off when you tick the box below. Census cannot see whether you actually made changes; the box is your confirmation.",
      items: [
        {
          name: "Burner Profile",
          text: "Opens your Burner Profile on the Burning Man website in a new tab. Log in, choose SETTINGS in the top right, then My Profile, and update anything that has changed. Your names and email in Census come from this profile, so keeping it current keeps our records correct. On the tablets (no internet) the link offers to email itself to you instead.",
        },
        {
          name: "I have reviewed and updated my Burner Profile",
          text: "Tick this once you have reviewed your profile. It checks the item off. Untick it to put the item back on your list.",
        },
      ],
    },
    {
      heading: "Record your passcode for on-playa access",
      intro:
        "Always on your checklist. It checks off once you have set a passcode. The passcode is used to sign in on the Census Lab tablets on playa.",
      items: [
        {
          name: "Set passcode / Update passcode",
          text: "Opens your My profile pop-up, where you can set or change your passcode. The button says Set passcode until you have one, and Update passcode afterwards. Write your passcode down and do not reuse one from anywhere else.",
        },
      ],
    },
    {
      heading:
        "Sign up for pre-event shifts to earn a Census SAP for early entry",
      intro:
        "Appears only if your arrival date is before the gates open, you are not Census Staff, and you have not said that another department is providing your early entry. It checks off once your signed-up shifts add up to at least 12 Census Shift Points and you have a shift on each required day. The Setup Access Pass itself also needs your signed Behavioral Standards and any required training.",
      items: [
        {
          name: "Sign up for at least 12 Census Shift Points",
          text: "Shows how many points you have from shifts you are signed up for out of the 12 needed. The box turns green once you reach 12. Points are counted when you sign up, not after you work the shift.",
        },
        {
          name: "Shift on <day>",
          text: "One line for each day Census needs you to have a shift, starting the day after your planned arrival. It turns green and says Fulfilled once you have a shift (with points) on that day. If only one day is left, a Monday or Tuesday shift can cover it. Changing your arrival date changes which days are listed.",
        },
        {
          name: "Download your SAP",
          text: "Appears once Census has issued your Setup Access Pass. It downloads the pass so you can print it before you come to playa.",
        },
      ],
    },
    {
      heading: "Staff — Early entry confirmed",
      intro:
        "Appears only for Census Staff and is always checked off. Census does not track shift points for Staff, so Staff do not see point totals or point progress bars on this page.",
      items: [],
    },
    {
      heading: "Meet shift requirements for …",
      intro:
        "One of these items appears for each camping or ticket arrangement Census has recorded for you. Each one asks you to sign up for shifts worth a set number of Census Shift Points, and the number is shown in the item. Staff see a short note instead of the progress bar.",
      items: [
        {
          name: "Meet shift requirements for Camping with Counter Culture",
          text: "Appears if Census has you down as camping with Counter Culture. A progress bar shows your points out of the number required, and it checks off when you reach it.",
        },
        {
          name: "Meet shift requirements for Camping with Census Lab",
          text: "Appears if Census has you down as camping with Census Lab. It also asks for one or two Census Lab Steward (Camp Steward) shifts, and it only checks off once you have the points and at least one of those shifts.",
        },
        {
          name: "Meet shift requirements for Census Ticket",
          text: "Appears if Census has you down for a Census ticket. A progress bar shows your points out of the number required, and it checks off when you reach it.",
        },
        {
          name: "Progress bar",
          text: 'Fills as the points from your signed-up shifts approach the number required. It says "Requirement fulfilled" once you are there. It only measures points; it is not a prize or a ranking.',
        },
        {
          name: "Browse and sign up for shifts (Census Lab Steward)",
          text: "Appears under the Camping with Census Lab item. Takes you to the Shifts page so you can sign up for your Camp Steward shifts.",
        },
      ],
    },
    {
      heading: "Sign up for one or two Camp Steward shifts",
      intro:
        "Appears only for Census Lab campers who have no point requirement listed. It checks off once you are signed up for a Census Lab Steward shift.",
      items: [
        {
          name: "Browse and sign up for shifts",
          text: "Takes you to the Shifts page to find and sign up for a Census Lab Steward shift.",
        },
      ],
    },
    {
      heading: "Complete required training courses",
      intro:
        "Appears once you have signed up for a shift that needs training, and lists each course those shifts need. It checks off when every listed course shows as completed.",
      items: [
        {
          name: "Course name (link)",
          text: 'Each course is a link. Tap it to open the course: off-playa it opens in the Census community on Hive in a new tab, and on the Census Lab tablets it opens a copy stored on the tablet. A green box and "Completed" mean the course is recorded as done; "Not yet completed" means it is still open. A course is recorded when you finish it and confirm at the end.',
        },
      ],
    },
    {
      heading: "Connect your Discord account (optional)",
      intro:
        'Appears only when you are not on the tablets, since the sign-in needs the internet. It is optional. Once you connect, the heading changes to "Discord — Connected" and the item is checked off.',
      items: [
        {
          name: "Connect Discord",
          text: "Sends you to Discord to sign in with your own Discord account. When you come back, Census knows which Discord account is yours, so Census helpers on the Census Discord can recognize you. It does not post anything for you.",
        },
        {
          name: "Disconnect Discord",
          text: "Appears once connected. It removes the link between your Discord account and your Census account. You can reconnect later.",
        },
      ],
    },
    {
      heading: "Get more involved with Census",
      intro:
        "A side panel (below the checklist on a phone) with optional ways to stay connected all year. These are not checklist items and nothing here checks off. Each link opens in a new tab; on the Census Lab tablets each one offers to email you the link to open later.",
      items: [
        {
          name: "Explore the Census Community on Hive",
          text: 'The Census community on Burning Man Hive, where volunteer training is held and you can learn about our volunteer roles. Log in with your Burner Profile ID and password. The link is "Visit the Census Community on Hive".',
        },
        {
          name: "Sign up as a DataNerd",
          text: 'Join the Data Nerds Google Group to take part in Census data analysis. No experience is needed. The link is "Learn more".',
        },
        {
          name: "Volunteer year-round",
          text: 'Join the year-round Google Groups mailing list to follow and join the discussions that guide Census. The link is "Learn more".',
        },
        {
          name: "Join the Census Discord",
          text: 'Connect with the Census community to see what we are up to all year. The link is "Join Discord".',
        },
      ],
    },
  ],
};

export const helpProfile: IHelpPage = {
  title: "My profile",
  sections: [
    {
      heading: "My profile",
      intro:
        "A read-only summary of how Census knows you. Your names and email come from your Burner Profile on the Burning Man website and are refreshed each time you sign in, so they cannot be changed here.",
      items: [
        {
          name: "Playa Name",
          text: "Your playa name as it appears on your Burner Profile. A dash means none is on file.",
        },
        {
          name: "World Name",
          text: "Your world (legal) name from your Burner Profile. A dash means none is on file.",
        },
        {
          name: "Email",
          text: "The email address from your Burner Profile. This is where Census sends your emails, such as shift confirmations. To change it, update your Burner Profile and sign in again.",
        },
        {
          name: "Roles",
          text: "The roles Census has given you, such as Staff or a volunteer role. They decide what you see and what is asked of you. You cannot edit them here. If one looks wrong, use the Contact page. This line is hidden if you have none.",
        },
        {
          name: "Visit your Burner Profile",
          text: "Opens your Burner Profile on the Burning Man website in a new tab, where you change your names or email. On the Census Lab tablets (no internet) it offers to email the link to you instead.",
        },
      ],
    },
    {
      heading: "Security",
      items: [
        {
          name: "Passcode",
          text: "Your passcode is a 4-digit number used only to sign in on the Census Lab tablets on playa, where you pick your name and type it in. It is not used to sign in on your phone or computer, which use your Burner Profile login.",
        },
        {
          name: "Reveal passcode",
          text: "Shows your current passcode on the Census logo so you can read it. Only you can see it. If you have not set one yet, you will see dashes instead of numbers.",
        },
        {
          name: "Hide",
          text: "Appears after you reveal your passcode. It hides the number again so nobody looking over your shoulder sees it.",
        },
        {
          name: "Update passcode",
          text: "Opens a box where you choose a new passcode. You type a 4-digit number twice (the eye icon shows or hides what you type). The two entries must match, and nothing else is accepted. The warning in the box reminds you not to use a passcode you use anywhere else.",
        },
        {
          name: "Update passcode (button in the box)",
          text: 'Saves your new passcode and closes the box. Your old passcode stops working and the new one replaces it, a confirmation message appears, and the "Record your passcode for on-playa access" item on your checklist checks off. No email is sent, so write the number down or use Reveal passcode to look it up later.',
        },
        {
          name: "Cancel",
          text: "Closes the box without changing anything. Your current passcode stays as it was.",
        },
      ],
    },
    {
      heading: "Closing this pop-up",
      items: [
        {
          name: "Close (X)",
          text: "Closes My profile and takes you back to the page you were on. Nothing is lost; each change here saves as soon as you make it.",
        },
      ],
    },
  ],
};

export const helpSettings: IHelpPage = {
  title: "App settings",
  sections: [
    {
      heading: "Settings",
      items: [
        {
          name: "Receive emails from Census",
          text: "Checked means you get Census's automatic emails; unchecked means you do not. The change saves the moment you click, and a confirmation message appears. It only affects you.",
        },
        {
          name: "Emails that stop when it is unchecked",
          text: "Shift emails and calendar invites: when you are assigned to a shift, when you drop or are removed from a shift, when a shift is canceled, and when a canceled shift comes back. Emails that would have been sent while you are unsubscribed are skipped, not saved, so you will not get them later.",
        },
        {
          name: "Emails that still arrive",
          text: 'Your Setup Access Pass, if Census emails it to you, is always sent because it is something you need for entry. So is an "email me this link" message from a Census Lab tablet, because you asked for it. Messages that the volunteer coordinators or other people send you directly, and Census mailing lists you joined separately, are not controlled by this checkbox.',
        },
        {
          name: "Unsubscribe link in emails",
          text: 'Each shift email ends with a "Click here to unsubscribe" link. After you sign in, it turns this checkbox off for you, and you land back here to see the result.',
        },
        {
          name: "Turning emails back on",
          text: "Check the box again at any time. You will receive emails from that point on, but not the ones skipped in the meantime.",
        },
      ],
    },
    {
      heading: "Closing this pop-up",
      items: [
        {
          name: "Close (X)",
          text: "Closes App settings and takes you back to the page you were on. There is no Save button, because your choice has already been saved.",
        },
      ],
    },
  ],
};

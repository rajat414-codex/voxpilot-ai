export interface ComposedEmail {
  to: string;
  from?: string;
  subject: string;
  body: string;
  topicType: 'leave' | 'job' | 'meeting' | 'resignation' | 'general';
}

export class EmailEngine {
  // Extracts to, from, subject, and topic from user prompt
  public parseEmailPrompt(text: string): { to: string; from: string; rawTopic: string } {
    const clean = text.trim();
    const emails = clean.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g) || [];

    let from = '';
    let to = '';

    // 1. Extract sender (from / by my mail / from my mail)
    const fromMatch = clean.match(
      /\b(by\s+(?:my\s+)?mail|from\s+(?:my\s+)?mail|from|sender|by\s+mail)\s+([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})/i
    );
    if (fromMatch) {
      from = fromMatch[2];
    }

    // 2. Extract recipient (to / ko / to the email of / email of)
    const toMatch = clean.match(
      /\b(to\s+(?:the\s+email\s+of|the\s+mail\s+of|email\s+of|mail\s+of)?|ko)\s*([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})/i
    );
    if (toMatch) {
      to = toMatch[2];
    } else if (emails.length > 0) {
      const candidate = emails[0] === from && emails.length > 1 ? emails[1] : (emails[0] !== from ? emails[0] : '');
      to = candidate || '';
    }

    // If still no valid to email but a placeholder name was given (e.g., "to manager", "boss ko")
    if (!to) {
      const nameMatch = clean.match(/\b(to|ko)\s+([a-zA-Z0-9._%+-]+)/i);
      if (nameMatch && !['the', 'email', 'my', 'mail'].includes(nameMatch[2].toLowerCase())) {
        to = `${nameMatch[2].toLowerCase()}@company.com`;
      }
    }

    // 3. Extract topic / purpose
    let rawTopic = clean
      .replace(
        /\b(application\s+leave|leave\s+application|write\s+an\s+email|compose\s+email|email\s+likho|bhejo|likh|send\s+email|email|mail)\b/gi,
        ''
      )
      .replace(
        /\b(to\s+(?:the\s+email\s+of|the\s+mail\s+of|email\s+of|mail\s+of)?|ko)\s*([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})/gi,
        ''
      )
      .replace(
        /\b(by\s+(?:my\s+)?mail|from\s+(?:my\s+)?mail|from)\s+([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})/gi,
        ''
      )
      .trim();

    return { to: to || 'manager@company.com', from, rawTopic };
  }

  // Generates complete, professionally formatted email body and subject
  public composeFormattedEmail(userPrompt: string): ComposedEmail {
    const { to, from, rawTopic } = this.parseEmailPrompt(userPrompt);
    const lower = userPrompt.toLowerCase();

    // LEAVE APPLICATION TEMPLATE
    if (lower.includes('leave') || lower.includes('chhutti') || lower.includes('sick') || lower.includes('fever')) {
      const isSick = lower.includes('sick') || lower.includes('fever') || lower.includes('doctor') || lower.includes('health');
      const subject = isSick
        ? 'Application for Sick Leave - Medical Urgency'
        : 'Formal Leave Application - Urgent Personal Matters';

      const reason = isSick
        ? 'I am currently suffering from high fever and severe health discomfort. The doctor has strictly advised complete medical rest for a few days to recover fully.'
        : 'I have urgent and unavoidable personal family commitments that require my immediate presence and attention.';

      const body = `Dear Sir/Madam,

I am writing this email to formally request a leave of absence from [Start Date] to [End Date].

${reason}

I have organized my current work responsibilities and handed over critical priorities to ensure that our operations remain uninterrupted during my absence. In case of any urgent matters requiring my direct input, I will be reachable via phone and email.

I kindly request you to approve my leave application. Thank you very much for your understanding and continuous support.

Warm regards,
[Your Name]
${from ? `Sender Email: ${from}` : ''}`.trim();

      return { to, from, subject, body, topicType: 'leave' };
    }

    // JOB APPLICATION / RESUME SUBMISSION
    if (
      lower.includes('job') ||
      lower.includes('apply') ||
      lower.includes('resume') ||
      lower.includes('internship') ||
      lower.includes('hiring')
    ) {
      const roleMatch = rawTopic.match(/\b(for|as)\s+([^.]+)/i);
      const role = roleMatch ? roleMatch[2].trim() : 'Software Developer';
      const subject = `Job Application: ${role} - [Your Name]`;

      const body = `Dear Hiring Team,

I am writing to express my strong enthusiasm and interest in applying for the ${role} position. With my hands-on background in technology, problem-solving, and dedication to excellence, I am confident in my ability to deliver immediate value to your organization.

I pride myself on fast learning, effective collaboration, and delivering impactful results. I have attached my resume for your detailed perusal.

I would welcome the opportunity to discuss how my qualifications align with your company's goals in an interview.

Thank you for your valuable time and consideration.

Sincerely,
[Your Name]
${from ? `Sender Email: ${from}` : ''}`.trim();

      return { to, from, subject, body, topicType: 'job' };
    }

    // MEETING / SYNC REQUEST
    if (lower.includes('meeting') || lower.includes('sync') || lower.includes('call') || lower.includes('discuss')) {
      const topic = rawTopic || 'Project Discussion & Next Steps';
      const subject = `Request for Discussion / Meeting: ${topic}`;

      const body = `Dear Colleague,

I hope you are having a productive week.

I would like to schedule a brief 15-20 minute discussion regarding ${topic}. We have important updates and progress milestones that would benefit from our alignment.

Please let me know your availability over the coming days, or feel free to suggest a convenient time that fits your schedule.

Looking forward to our conversation.

Best regards,
[Your Name]
${from ? `Sender Email: ${from}` : ''}`.trim();

      return { to, from, subject, body, topicType: 'meeting' };
    }

    // RESIGNATION / NOTICE
    if (lower.includes('resignation') || lower.includes('resign') || lower.includes('notice period')) {
      const subject = 'Formal Resignation Letter - [Your Name]';
      const body = `Dear Management,

Please accept this email as formal notification that I am resigning from my position. My last working day will be [Date], in accordance with my contractual notice period.

I want to extend my heartfelt appreciation for the opportunities, mentorship, and professional guidance provided to me during my time with the organization.

I will ensure a seamless and thorough knowledge transfer of all my active responsibilities prior to my departure.

Wishing the company continued growth and success.

Respectfully,
[Your Name]
${from ? `Sender Email: ${from}` : ''}`.trim();

      return { to, from, subject, body, topicType: 'resignation' };
    }

    // GENERAL CUSTOM TOPIC
    const topicTitle = rawTopic ? rawTopic.charAt(0).toUpperCase() + rawTopic.slice(1) : 'Important Formal Correspondence';
    const subject = `Regarding: ${topicTitle}`;
    const body = `Dear Sir/Madam,

I hope this email finds you in good health.

I am writing to bring to your attention our discussion regarding ${rawTopic || 'our ongoing project and key deliverables'}.

Please review the attached details at your earliest convenience and let me know if you require any further clarification or documentation from my end.

Thank you for your time and prompt consideration.

Kind regards,
[Your Name]
${from ? `Sender Email: ${from}` : ''}`.trim();

    return { to, from, subject, body, topicType: 'general' };
  }
}

export const defaultEmailEngine = new EmailEngine();

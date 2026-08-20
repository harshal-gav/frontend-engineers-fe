

export interface ClickableElement {
  index: number;
  text: string;
  tag: string;
}

export async function askGeminiToClick(
  apiKey: string,
  elements: ClickableElement[],
  companyName: string
): Promise<number | null> {
  const elementsList = elements
    .map(e => `[${e.index}] ${e.tag.toUpperCase()}: "${e.text}"`)
    .join('\n');

  const prompt = `You are an AI web scraping agent tasked with finding the open job listings for ${companyName}.
I am on their career page, but the jobs are hidden. I need to click a button or link to view the open roles.

Here are the clickable elements currently on the screen:
${elementsList}

Which element is the MOST LIKELY button or link to reveal the job board or open positions? 
Look for things like "View Open Roles", "Explore Jobs", "Search Openings", "Careers", "See all positions".
Avoid clicking on generic things like "Login", "Privacy Policy", or "About Us".

Reply with ONLY the integer index of the element to click. If absolutely none of them look like they lead to jobs, reply with -1. Do not output anything else.`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 10,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini API error ${response.status}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    const index = parseInt(text.trim(), 10);
    if (!isNaN(index) && index >= 0) {
      return index;
    }
    return null;
  } catch (error) {
    console.error(`   ❌ Agentic click decision failed:`, error);
    return null;
  }
}

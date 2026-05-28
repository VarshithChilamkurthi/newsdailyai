from groq import Groq


class LinkedInPostGenerator:
    def __init__(self, api_key: str, model: str = "llama-3.3-70b-versatile"):
        self.api_key = api_key
        self.model = model
        self.client = Groq(api_key=api_key) if api_key else None

    def _build_prompt(self, article: dict, tone: str) -> str:
        summary = article.get("summary") or article.get("content_markdown", "")
        return f"""You are an expert LinkedIn content creator specializing in AI and software development. Your task is to convert a technical article into a compelling LinkedIn post that performs well.

Rules:
- Start with a strong hook: a provocative question, a bold prediction, or a counter-intuitive statement.
- Format for mobile with line breaks between nearly every sentence.
- Use 3-5 emoji bullet points (like 🔥, 💡, ⚡️, 🚀, 🧠) to highlight key takeaways. Make each one a complete, impactful sentence.
- End by asking a thoughtful question to drive comments and a personal sign-off like 'Thoughts? 👇'
- Include 3-5 relevant hashtags.
- Tone: Professional but conversational, like a smart colleague sharing insights over coffee.
- Maximum character count: 1300.

Article:
Title: {article['title']}
Source: {article['source_name']}
Summary: {summary}

Generate the LinkedIn post now:"""

    def _fallback_post(self, article: dict) -> str:
        title = article.get("title", "Untitled")
        source = article.get("source_name", "Unknown")
        summary = (
            article.get("summary") or article.get("content_markdown", "")
        ).strip()
        if not summary:
            summary = "Worth a read for anyone building in tech."

        if len(summary) > 400:
            summary = summary[:397] + "..."

        return f"""What if the next big idea in tech is hiding in this headline?

{title}

🔥 A fresh take from {source} that's worth your attention.
💡 {summary}
⚡️ Great signal for builders tracking where the industry is heading.
🚀 Save it for your next deep-dive session.

What's your take on this trend?

Thoughts? 👇

#AI #SoftwareDevelopment #TechNews #Innovation #Programming"""

    def generate_post(self, article: dict, tone: str = "professional") -> str:
        prompt = self._build_prompt(article, tone)

        try:
            if not self.client:
                raise ValueError("Groq API key is not configured")

            response = self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.8,
            )
            content = response.choices[0].message.content
            if content:
                return content.strip()
            raise ValueError("Empty response from Groq API")
        except Exception as e:
            print(f"Error generating LinkedIn post: {e}")
            return self._fallback_post(article)

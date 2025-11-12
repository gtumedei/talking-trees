// app/chatbot/page.tsx
import ChatbotContent from "./ChatbotContent";

interface Props {
  searchParams?: { variant?: string };
}

export default async function ChatbotPage({ searchParams }: Props) {
  // searchParams è una Promise, quindi facciamo await
  const params = searchParams ? await searchParams : {};
  const variant = params?.variant || "narrativo";

  return <ChatbotContent variant={variant} />;
}

import ChatbotContent from "./ChatbotContent";

interface Props {
  searchParams?: { variant?: string };
}

export default async function ChatbotPage({ searchParams }: Props) {
  const params = searchParams ? await searchParams : {};
  const variant = params?.variant;

  // Usa un fallback se `variant` è undefined o non valido
  const selectedVariant: "statico" | "chatbot-scientifico" | "chatbot-narrativo" =
    (["statico", "chatbot-scientifico", "chatbot-narrativo"].includes(variant ?? "")
      ? variant : "chatbot-narrativo") as "statico" | "chatbot-scientifico" | "chatbot-narrativo"; 

  return <ChatbotContent variant={selectedVariant} />;
}

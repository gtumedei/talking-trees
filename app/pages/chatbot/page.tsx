import { UserContext } from "@/app/layout";
import ChatbotContent from "./ChatbotContent";
import { UserContextType } from "@/backend/types/interface_context";

interface Props {
  searchParams?: { variant?: string };
}

export default async function ChatbotPage({ searchParams }: Props) {
  const params = searchParams ? await searchParams : {};
  const variant = params?.variant;

  // Usa un fallback se `variant` è undefined o non valido
  const selectedVariant: "statico" | "scientifico" | "narrativo" =
    (["statico", "scientifico", "narrativo"].includes(variant ?? "")
      ? variant : "narrativo") as "statico" | "scientifico" | "narrativo"; 

  return <ChatbotContent variant={selectedVariant} />;
}

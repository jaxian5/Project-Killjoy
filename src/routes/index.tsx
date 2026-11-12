import { createFileRoute } from "@tanstack/react-router";
import { CardStudio } from "@/components/card-studio";

export const Route = createFileRoute("/")({ component: CardStudio });

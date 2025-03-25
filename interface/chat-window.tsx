import { formatDate, formatFileDate } from "@/utils/date.ts";
import { ModelName, Provider } from "@/utils/models.ts";
import { pkg } from "@/utils/paths.ts";

interface ChatInterfaceProps {
	model: ModelName;
	provider: Provider;
}

export default function createChatInterface({
	model,
	provider,
}: ChatInterfaceProps) {
	const modelInfo = `${model} (${provider})`;
}

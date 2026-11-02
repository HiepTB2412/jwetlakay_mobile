import { Screen } from "@/components/screen";
import { ThemedText } from "@/components/themed-text";

export default function Index() {
  return (
    <Screen>
      <ThemedText variant="title">Edit src/app/index.tsx to edit this screen.</ThemedText>
      <ThemedText className="text-red-500">Tiêu đề</ThemedText>
    </Screen>
  );
}

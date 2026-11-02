import { Text } from "react-native";

import { Screen } from "@/components/screen";
import { ThemedText } from "@/components/themed-text";

export default function Index() {
  return (
    <Screen>
      <ThemedText variant="title">Edit src/app/index.tsx to edit this screen.</ThemedText>
      <Text className="text-red-500">Tiêu đề</Text>
    </Screen>
  );
}
